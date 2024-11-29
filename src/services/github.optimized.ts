import { BotActivity } from '../types';

const GITHUB_TOKEN = import.meta.env['VITE_GITHUB_TOKEN'] ?? '';
const REPO_OWNER = 'All-Hands-AI';
const REPO_NAME = 'OpenHands';

interface GitHubUser {
  login: string;
  type: string;
}

interface GitHubComment {
  id: string;
  html_url: string;
  created_at: string;
  body: string;
  user: GitHubUser;
  issue_url?: string;
}

interface GitHubIssue {
  number: number;
  html_url: string;
  comments_url: string;
  comments: number;
  pull_request?: {
    url: string;
    html_url: string;
    diff_url: string;
    patch_url: string;
  };
}

interface GitHubPR {
  number: number;
  html_url: string;
  comments_url: string;
  comments: number;
}

interface GitHubResponse<T> {
  data: T;
  hasNextPage: boolean;
  nextUrl: string | null;
}

async function fetchWithRetry<T>(url: string, retries = 3, delay = 1000): Promise<GitHubResponse<T>> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN as string}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status.toString()} ${response.statusText}`);
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

      const data = await response.json() as T;
      return { data, hasNextPage, nextUrl };
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1))); // Exponential backoff
      }
    }
  }
  throw lastError;
}

async function fetchAllPages<T>(url: string): Promise<T[]> {
  const allItems: T[] = [];
  let currentUrl = url;
  let pageCount = 0;

  while (currentUrl !== '') {
    pageCount++;
    console.log(`Fetching page ${pageCount.toString()} from ${currentUrl}`);
    const response = await fetchWithRetry<T[]>(currentUrl);
    console.log(`Got ${response.data.length.toString()} items`);
    allItems.push(...response.data);
    currentUrl = response.nextUrl ?? '';
    if (currentUrl !== '') {
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between pages
    }
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
  return lowerBody.includes('started fixing the issue') || 
         lowerBody.includes('i will help you') || 
         lowerBody.includes('i\'ll help you') ||
         lowerBody.includes('i can help you');
}

function isSuccessComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return lowerBody.includes('created a pull request') ||
         lowerBody.includes('opened a pull request') ||
         lowerBody.includes('submitted a pull request') ||
         lowerBody.includes('successfully fixed') ||
         lowerBody.includes('completed the changes') ||
         lowerBody.includes('implemented the changes');
}

function isFailureComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return (lowerBody.includes('apologize') || lowerBody.includes('sorry')) &&
         (lowerBody.includes('unable to') || lowerBody.includes('cannot') || lowerBody.includes('can\'t')) ||
         lowerBody.includes('unsuccessful') ||
         lowerBody.includes('manual intervention may be required');
}

function isPRModificationComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return lowerBody.includes('help you modify') ||
         lowerBody.includes('help you update') ||
         lowerBody.includes('help you with the changes');
}

function isPRModificationSuccessComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return lowerBody.includes('updated the pull request') ||
         lowerBody.includes('made the requested changes') ||
         lowerBody.includes('applied the changes') ||
         lowerBody.includes('pushed the changes') ||
         lowerBody.includes('committed the changes') ||
         lowerBody.includes('implemented the requested changes');
}

function isPRModificationFailureComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return (lowerBody.includes('apologize') || lowerBody.includes('sorry')) &&
         (lowerBody.includes('unable to modify') || lowerBody.includes('cannot modify') || lowerBody.includes('can\'t modify')) ||
         lowerBody.includes('unsuccessful') ||
         lowerBody.includes('manual intervention may be required');
}

function processComments(comments: GitHubComment[], itemNumber: number, type: 'issue' | 'pr'): BotActivity[] {
  const activities: BotActivity[] = [];

  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    const isStart = type === 'issue' ? isStartWorkComment(comment) : isPRModificationComment(comment);
    
    if (isStart) {
      // Look for the next relevant comment to determine success/failure
      const nextComments = comments.slice(i + 1);
      const successComment = nextComments.find(
        type === 'issue' ? isSuccessComment : isPRModificationSuccessComment
      );
      const failureComment = nextComments.find(
        type === 'issue' ? isFailureComment : isPRModificationFailureComment
      );

      const resultComment = successComment ?? failureComment;
      if (resultComment !== undefined) {
        activities.push({
          id: `${type}-${itemNumber.toString()}-${comment.id}`,
          type,
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

export async function fetchBotActivities(since?: string): Promise<BotActivity[]> {
  try {
    const baseUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
    
    // Set up parameters for fetching issues and PRs
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

    // Fetch all issues and PRs in parallel with their comments
    const items = await fetchAllPages<GitHubIssue>(`${baseUrl}/issues?${params.toString()}`);
    
    // Filter items with comments and group by type
    const itemsWithComments = items.filter(item => item.comments > 0);
    const issues = itemsWithComments.filter(item => !item.pull_request);
    const prs = itemsWithComments.filter(item => item.pull_request);

    // Fetch comments for each type in parallel
    const [issueComments, prComments] = await Promise.all([
      // Fetch issue comments in batches
      (async () => {
        const commentsByIssue = new Map<number, GitHubComment[]>();
        const batchSize = 5;
        for (let i = 0; i < issues.length; i += batchSize) {
          const batch = issues.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async item => {
              const comments = await fetchAllPages<GitHubComment>(item.comments_url);
              commentsByIssue.set(item.number, comments);
            })
          );
          if (i + batchSize < issues.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        return commentsByIssue;
      })(),
      // Fetch PR comments in batches
      (async () => {
        const commentsByPR = new Map<number, GitHubComment[]>();
        const batchSize = 5;
        for (let i = 0; i < prs.length; i += batchSize) {
          const batch = prs.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async item => {
              const comments = await fetchAllPages<GitHubComment>(item.comments_url);
              commentsByPR.set(item.number, comments);
            })
          );
          if (i + batchSize < prs.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        return commentsByPR;
      })()
    ]);

    // Process issues and PRs in parallel
    const [issueActivities, prActivities] = await Promise.all([
      Promise.all(
        issues.map(async item => {
          const comments = issueComments.get(item.number) ?? [];
          return processComments(comments, item.number, 'issue');
        })
      ),
      Promise.all(
        prs.map(async item => {
          const comments = prComments.get(item.number) ?? [];
          return processComments(comments, item.number, 'pr');
        })
      )
    ]);

    // Flatten and sort activities
    return [...issueActivities.flat(), ...prActivities.flat()]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  } catch (error) {
    console.error('Error fetching bot activities:', error);
    throw error;
  }
}