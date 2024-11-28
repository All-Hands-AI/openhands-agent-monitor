import { BotActivity } from '../types';

const GITHUB_TOKEN = process.env['VITE_GITHUB_TOKEN'] ?? '';
const REPO_OWNER = 'All-Hands-AI';
const REPO_NAME = 'openhands';

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
}

interface GitHubIssue {
  number: number;
  html_url: string;
  comments_url: string;
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
}

async function fetchWithAuth<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status.toString()} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
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
         lowerBody.includes('submitted a pull request');
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
         lowerBody.includes('applied the changes');
}

function isPRModificationFailureComment(comment: GitHubComment): boolean {
  if (!isBotComment(comment)) return false;
  const lowerBody = comment.body.toLowerCase();
  return (lowerBody.includes('apologize') || lowerBody.includes('sorry')) &&
         (lowerBody.includes('unable to modify') || lowerBody.includes('cannot modify') || lowerBody.includes('can\'t modify')) ||
         lowerBody.includes('unsuccessful') ||
         lowerBody.includes('manual intervention may be required');
}

async function processIssueComments(issue: GitHubIssue): Promise<BotActivity[]> {
  const activities: BotActivity[] = [];
  const comments = await fetchWithAuth<GitHubComment[]>(issue.comments_url);

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
          id: `issue-${issue.number.toString()}-${comment.id}`,
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

async function processPRComments(pr: GitHubPR): Promise<BotActivity[]> {
  const activities: BotActivity[] = [];
  const comments = await fetchWithAuth<GitHubComment[]>(pr.comments_url);

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
          id: `pr-${pr.number.toString()}-${comment.id}`,
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

export async function fetchBotActivities(since?: string): Promise<BotActivity[]> {
  try {
    const activities: BotActivity[] = [];
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
    }

    // Fetch issues
    const issues = await fetchWithAuth<GitHubIssue[]>(`${baseUrl}/issues?${params.toString()}`);
    for (const issue of issues) {
      if (issue.pull_request === undefined) { // Skip PRs from issues endpoint
        const issueActivities = await processIssueComments(issue);
        activities.push(...issueActivities);
      }
    }

    // Fetch PRs
    const prs = await fetchWithAuth<GitHubPR[]>(`${baseUrl}/pulls?${params.toString()}`);
    for (const pr of prs) {
      const prActivities = await processPRComments(pr);
      activities.push(...prActivities);
    }

    // Sort by timestamp in descending order
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error fetching bot activities:', error);
    throw error;
  }
}