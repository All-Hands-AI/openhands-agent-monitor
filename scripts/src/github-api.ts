import type { GitHubComment, GitHubIssue, GitHubPR, ApiResponse, Activity } from './types';

const GITHUB_TOKEN = process.env['GITHUB_TOKEN'] ?? '';
const REPO_OWNER = 'All-Hands-AI';
const REPO_NAME = 'OpenHands';

async function fetchWithAuth(url: string): Promise<ApiResponse> {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GitHub API error: ${response.status.toString()} ${response.statusText}\n${errorBody}`);
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

function isBotComment(comment: GitHubComment): boolean {
  return comment.user.login === 'openhands-agent' ||
    (comment.user.login === 'github-actions[bot]' && comment.user.type === 'Bot');
}

function isStartWorkComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return lowerBody.includes('started fixing the') ||
    lowerBody.includes('openhands started fixing');
}

function isSuccessComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return lowerBody.includes('a potential fix has been generated and a draft pr') ||
    lowerBody.includes('openhands made the following changes to resolve the issues') ||
    lowerBody.includes('successfully fixed');
}

function isFailureComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return lowerBody.includes('the workflow to fix this issue encountered an error') ||
    lowerBody.includes('openhands failed to create any code changes') ||
    lowerBody.includes('an attempt was made to automatically fix this issue, but it was unsuccessful');
}

function isPRModificationComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return lowerBody.includes('started fixing the') ||
    lowerBody.includes('openhands started fixing');
}

function isPRModificationSuccessComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return lowerBody.includes('openhands made the following changes to resolve the issues') ||
    lowerBody.includes('updated pull request');
}

function isPRModificationFailureComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return lowerBody.includes('the workflow to fix this issue encountered an error') ||
    lowerBody.includes('openhands failed to create any code changes') ||
    lowerBody.includes('an attempt was made to automatically fix this issue, but it was unsuccessful');
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
        activities.push({
          id: `issue-${String(issue.number)}-${String(comment.id)}`,
          type: 'issue',
          status: successComment !== undefined ? 'success' : 'failure',
          timestamp: comment.created_at,
          url: resultComment.html_url,
          description: resultComment.body,
        });
      }
    }
  }

  return activities;
}

async function processPRComments(pr: GitHubPR): Promise<Activity[]> {
  const activities: Activity[] = [];
  const comments = await fetchAllPages<GitHubComment>(pr.comments_url);

  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    if (comment && isPRModificationComment(comment)) {
      // Look for the next relevant comment to determine success/failure
      const nextComments = comments.slice(i + 1);
      const successComment = nextComments.find(isPRModificationSuccessComment);
      const failureComment = nextComments.find(isPRModificationFailureComment);
      const resultComment = successComment ?? failureComment;

      if (resultComment !== undefined) {
        activities.push({
          id: `pr-${String(pr.number)}-${String(comment.id)}`,
          type: 'pr',
          status: successComment !== undefined ? 'success' : 'failure',
          timestamp: comment.created_at,
          url: resultComment.html_url,
          description: resultComment.body,
        });
      }
    }
  }

  return activities;
}

const startTime = performance.now();

async function main() {
  try {
    await fetchBotActivities();
  } catch (error) {
    process.stderr.write(`${error}\n`);
    process.exit(1);
  }
}

main();

export async function fetchBotActivities(since?: string): Promise<Activity[]> {
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
            html_url: item.html_url,
            comments_url: item.comments_url,
            comments: item.comments
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
    console.error('Error fetching bot activities:', error);
    const totalTime = (performance.now() - startTime) / 1000;
    console.log(`Total execution time: ${totalTime.toFixed(2)}s (failed)`);
    throw error;
  }
}