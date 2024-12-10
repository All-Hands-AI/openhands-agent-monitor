import type { GitHubComment, GitHubIssue, GitHubPR, ApiResponse, Activity } from './types';
import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

const GITHUB_TOKEN = process.env['GITHUB_TOKEN'] ?? '';
const REPO_OWNER = 'All-Hands-AI';
const REPO_NAME = 'OpenHands';

import fs from 'fs';

async function fetchWithAuth<T = any[]>(url: string): Promise<ApiResponse<T>> {
  // Log the request
  fs.appendFileSync('github-api.log', `\n[${new Date().toISOString()}] REQUEST: ${url}\n`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    fs.appendFileSync('github-api.log', `[${new Date().toISOString()}] ERROR: ${String(response.status)} ${String(response.statusText)}\n${String(errorBody)}\n`);
    throw new Error(`GitHub API error: ${String(response.status)} ${String(response.statusText)}\n${String(errorBody)}`);
  }

  // Parse Link header for pagination
  const linkHeader = response.headers.get('Link') ?? '';
  let hasNextPage = false;
  let nextUrl: string | null = null;

  if (linkHeader !== '') {
    const links = linkHeader.split(',');
    for (const link of links) {
      const [url, rel] = link.split(';');
      if (rel?.includes('rel="next"')) {
        hasNextPage = true;
        nextUrl = url?.trim()?.slice(1, -1) ?? null; // Remove < and >
        break;
      }
    }
  }

  const data = await response.json();
  // Log the response
  fs.appendFileSync('github-api.log', `[${new Date().toISOString()}] RESPONSE: ${JSON.stringify(data, null, 2)}\n`);
  return { data, hasNextPage, nextUrl };
}

async function fetchAllPages<T>(url: string): Promise<T[]> {
  const allItems: T[] = [];
  let currentUrl = url;
  let pageCount = 0;

  while (currentUrl !== '') {
    pageCount++;
    console.log(`Fetching page ${pageCount.toString()} from ${currentUrl}`);
    const response = await fetchWithAuth(currentUrl);
    console.log(`Got ${response.data.length.toString()} items`);
    allItems.push(...(response.data as T[]));
    currentUrl = response.nextUrl ?? '';
  }

  console.log(`Total items fetched: ${allItems.length.toString()}`);
  return allItems;
}

export function isBotComment(comment: GitHubComment): boolean {
  return comment.user.login === 'openhands-agent' ||
    (comment.user.login === 'github-actions[bot]' && comment.user.type === 'Bot');
}

export function isStartWorkComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return lowerBody.includes('started fixing the') ||
    lowerBody.includes('openhands started fixing');
}

export function isSuccessComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) {
    fs.appendFileSync('github-api.log', `[${new Date().toISOString()}] COMMENT CHECK: Not a bot comment - ${comment.user.login}\n`);
    return false;
  }
  const lowerBody = comment.body.toLowerCase();
  const isSuccess = lowerBody.includes('a potential fix has been generated') ||
    lowerBody.includes('openhands made the following changes to resolve the issues') ||
    lowerBody.includes('successfully fixed') ||
    lowerBody.includes('updated pull request');
  fs.appendFileSync('github-api.log', `[${new Date().toISOString()}] COMMENT CHECK: Bot comment - Success: ${String(isSuccess)}\nBody: ${comment.body}\n`);
  return isSuccess;
}

export function isFailureComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return lowerBody.includes('the workflow to fix this issue encountered an error') ||
    lowerBody.includes('openhands failed to create any code changes') ||
    lowerBody.includes('an attempt was made to automatically fix this issue, but it was unsuccessful');
}

export function isPRModificationComment(comment: GitHubComment): boolean {
  return isStartWorkComment(comment);
}

export function isPRModificationSuccessComment(comment: GitHubComment): boolean {
  return isSuccessComment(comment);
}

export function isPRModificationFailureComment(comment: GitHubComment): boolean {
  return isFailureComment(comment);
}

async function processIssueComments(issue: GitHubIssue): Promise<Activity[]> {
  const activities: Activity[] = [];
  const comments = await fetchAllPages<GitHubComment>(issue.comments_url);

  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    if (comment && isStartWorkComment(comment)) {
      // Look for the next relevant comment to determine success/failure
      const nextComments = comments.slice(i + 1);
      const successComment = nextComments.find(isSuccessComment);
      const failureComment = nextComments.find(isFailureComment);
      const resultComment = successComment ?? failureComment;

      if (resultComment !== undefined) {
        const status = successComment !== undefined ? 'success' : 'failure';
        const timestamp = new Date(resultComment.created_at).toLocaleString();
        activities.push({
          id: `issue-${String(issue.number)}-${String(comment.id)}`,
          type: 'issue',
          status,
          timestamp: resultComment.created_at,
          url: resultComment.html_url,
          title: `ISSUE ${status} ${timestamp} -- ${issue.title}`,
          description: issue.body.slice(0, 500) + (issue.body.length > 500 ? '...' : ''),
        });
      }
    }
  }

  return activities;
}

async function processPRComments(pr: GitHubPR): Promise<Activity[]> {
  const activities: Activity[] = [];
  const comments = await fetchAllPages<GitHubComment>(pr.comments_url);

  // Fetch PR details to get state and merged status
  const baseUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
  const prResponse = await fetchWithAuth<{ state: string; merged: boolean }>(`${baseUrl}/pulls/${pr.number}`);
  const prDetails = prResponse.data as { state: string; merged: boolean };

  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    if (comment && isPRModificationComment(comment)) {
      // Look for the next relevant comment to determine success/failure
      const nextComments = comments.slice(i + 1);
      const successComment = nextComments.find(isPRModificationSuccessComment);
      const failureComment = nextComments.find(isPRModificationFailureComment);
      const resultComment = successComment ?? failureComment;

      if (resultComment !== undefined) {
        // Determine PR status based on whether PR was created and its state
        let status: Activity['status'];
        if (!successComment) {
          status = 'no_pr';
        } else if (prDetails.merged) {
          status = 'pr_merged';
        } else if (prDetails.state === 'closed') {
          status = 'pr_closed';
        } else {
          status = 'pr_open';
        }

        const timestamp = new Date(resultComment.created_at).toLocaleString();
        const statusText = {
          'no_pr': 'No PR',
          'pr_open': 'PR Open',
          'pr_merged': 'PR Merged',
          'pr_closed': 'PR Closed'
        }[status];

        activities.push({
          id: `pr-${String(pr.number)}-${String(comment.id)}`,
          type: 'pr',
          status,
          timestamp: resultComment.created_at,
          url: resultComment.html_url,
          title: `${statusText} ${timestamp} -- ${pr.title}`,
          description: pr.body ? (pr.body.slice(0, 500) + (pr.body.length > 500 ? '...' : '')) : 'No description provided',
        });
      }
    }
  }

  return activities;
}

// Only run main() if this file is being run directly
if (require.main === module) {
  async function main() {
    try {
      const activities = await fetchBotActivities();
      process.stdout.write(JSON.stringify(activities, null, 2));
    } catch (error) {
      process.stderr.write(String(error) + '\n');
      process.exit(1);
    }
  }
  main();
}

export async function fetchBotActivities(since?: string): Promise<Activity[]> {
  const startTime = performance.now();
  try {
    if (!GITHUB_TOKEN || GITHUB_TOKEN === 'placeholder') {
      process.stderr.write('Error: GITHUB_TOKEN environment variable is not set or invalid\n');
      throw new Error(String('Invalid GITHUB_TOKEN'));
    }
    console.log('Starting bot activities fetch...');
    const activities: Activity[] = [];
    const baseUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

    // Fetch issues and PRs with comments
    const params = new URLSearchParams({
      state: 'all',
      sort: 'updated',
      direction: 'desc',
      per_page: '100',
    });

    if (since !== undefined && since !== '') {
      params.append('since', since);
    } else {
      // Default to last 30 days if no since parameter
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      params.append('since', thirtyDaysAgo.toISOString());
    }

    // Fetch issues and PRs
    console.log('Fetching issues and PRs...');
    const fetchStartTime = performance.now();
    const items = await fetchAllPages<GitHubIssue>(`${baseUrl}/issues?${params.toString()}`);
    console.log(`Fetched ${String(items.length)} items in ${((performance.now() - fetchStartTime) / 1000).toFixed(2)}s`);

    console.log('Processing items...');
    const processStartTime = performance.now();
    // Filter items that have comments
  const itemsWithComments = items.filter(item => item.comments > 0);
  console.log(`Processing ${String(itemsWithComments.length)} items with comments in parallel...`);

  // Process items in parallel
  const batchSize = 10; // Process 10 items at a time to avoid rate limiting
  const results = [];
  
  for (let i = 0; i < itemsWithComments.length; i += batchSize) {
    const batch = itemsWithComments.slice(i, i + batchSize);
    const batchNumber = Math.floor(i/batchSize) + 1;
    const totalBatches = Math.ceil(itemsWithComments.length/batchSize);
    console.log(`Processing batch ${String(batchNumber)}/${String(totalBatches)}...`);
    
    const batchResults = await Promise.all(
      batch.map(async item => {
        if (item.pull_request === undefined) {
          // Process regular issues
          return processIssueComments(item);
        } else {
          // Process PRs through the issue comments endpoint to catch all activity
          return processPRComments({
            number: item.number,
            title: item.title,
            html_url: item.html_url,
            comments_url: item.comments_url,
            comments: item.comments,
            body: item.body
          });
        }
      })
    );
    
    results.push(...batchResults);
  }

  // Flatten results and add to activities
  activities.push(...results.flat());

    console.log(`Processed all items in ${((performance.now() - processStartTime) / 1000).toFixed(2)}s`);

    // Sort by timestamp in descending order
    console.log('Sorting activities...');
    const sortStartTime = performance.now();
    const sortedActivities = activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    console.log(`Sorted ${String(activities.length)} activities in ${((performance.now() - sortStartTime) / 1000).toFixed(2)}s`);

    const totalTime = (performance.now() - startTime) / 1000;
    console.log(`Total execution time: ${totalTime.toFixed(2)}s`);

    return sortedActivities;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write('Error fetching bot activities: ' + errorMessage + '\n');
    const totalTime = (performance.now() - startTime) / 1000;
    process.stderr.write('Total execution time: ' + totalTime.toFixed(2) + 's (failed)\n');
    throw new Error(errorMessage);
  }
}