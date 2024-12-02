const GITHUB_TOKEN = process.env['GITHUB_TOKEN'] ?? '';
const REPO_OWNER = 'All-Hands-AI';
const REPO_NAME = 'OpenHands';
async function fetchWithAuth(url) {
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
        },
    });
    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status.toString()} ${response.statusText}`);
    }
    // Parse Link header for pagination
    const linkHeader = response.headers.get('Link') ?? '';
    let hasNextPage = false;
    let nextUrl = null;
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
async function fetchAllPages(url) {
    const allItems = [];
    let currentUrl = url;
    let pageCount = 0;
    while (currentUrl !== '') {
        pageCount++;
        console.log(`Fetching page ${pageCount.toString()} from ${currentUrl}`);
        const response = await fetchWithAuth(currentUrl);
        console.log(`Got ${response.data.length.toString()} items`);
        allItems.push(...response.data);
        currentUrl = response.nextUrl ?? '';
    }
    console.log(`Total items fetched: ${allItems.length.toString()}`);
    return allItems;
}
function isBotComment(comment) {
    return comment.user.login === 'openhands-agent' ||
        (comment.user.login === 'github-actions[bot]' && comment.user.type === 'Bot');
}
function isStartWorkComment(comment) {
    if (!isBotComment(comment))
        return false;
    const lowerBody = comment.body.toLowerCase();
    return lowerBody.includes('started fixing the issue') ||
        lowerBody.includes('i will help you') ||
        lowerBody.includes('i\'ll help you') ||
        lowerBody.includes('i can help you');
}
function isSuccessComment(comment) {
    if (!isBotComment(comment))
        return false;
    const lowerBody = comment.body.toLowerCase();
    return lowerBody.includes('created a pull request') ||
        lowerBody.includes('opened a pull request') ||
        lowerBody.includes('submitted a pull request') ||
        lowerBody.includes('successfully fixed') ||
        lowerBody.includes('completed the changes') ||
        lowerBody.includes('implemented the changes');
}
function isFailureComment(comment) {
    if (!isBotComment(comment))
        return false;
    const lowerBody = comment.body.toLowerCase();
    return (lowerBody.includes('apologize') || lowerBody.includes('sorry')) &&
        (lowerBody.includes('unable to') || lowerBody.includes('cannot') || lowerBody.includes('can\'t')) ||
        lowerBody.includes('unsuccessful') ||
        lowerBody.includes('manual intervention may be required');
}
function isPRModificationComment(comment) {
    if (!isBotComment(comment))
        return false;
    const lowerBody = comment.body.toLowerCase();
    return lowerBody.includes('help you modify') ||
        lowerBody.includes('help you update') ||
        lowerBody.includes('help you with the changes');
}
function isPRModificationSuccessComment(comment) {
    if (!isBotComment(comment))
        return false;
    const lowerBody = comment.body.toLowerCase();
    return lowerBody.includes('updated the pull request') ||
        lowerBody.includes('made the requested changes') ||
        lowerBody.includes('applied the changes') ||
        lowerBody.includes('pushed the changes') ||
        lowerBody.includes('committed the changes') ||
        lowerBody.includes('implemented the requested changes');
}
function isPRModificationFailureComment(comment) {
    if (!isBotComment(comment))
        return false;
    const lowerBody = comment.body.toLowerCase();
    return (lowerBody.includes('apologize') || lowerBody.includes('sorry')) &&
        (lowerBody.includes('unable to modify') || lowerBody.includes('cannot modify') || lowerBody.includes('can\'t modify')) ||
        lowerBody.includes('unsuccessful') ||
        lowerBody.includes('manual intervention may be required');
}
async function processIssueComments(issue) {
    const activities = [];
    const comments = await fetchAllPages(issue.comments_url);
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
async function processPRComments(pr) {
    const activities = [];
    const comments = await fetchAllPages(pr.comments_url);
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
export async function fetchBotActivities(since) {
    try {
        const activities = [];
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
        else {
            // Default to last 30 days if no since parameter
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            params.append('since', thirtyDaysAgo.toISOString());
        }
        // Fetch issues and PRs
        const items = await fetchAllPages(`${baseUrl}/issues?${params.toString()}`);
        for (const item of items) {
            if (item.comments > 0) {
                if (item.pull_request === undefined) {
                    // Process regular issues
                    const issueActivities = await processIssueComments(item);
                    activities.push(...issueActivities);
                }
                else {
                    // Process PRs through the issue comments endpoint to catch all activity
                    const prActivities = await processPRComments({
                        number: item.number,
                        html_url: item.html_url,
                        comments_url: item.comments_url,
                        comments: item.comments
                    });
                    activities.push(...prActivities);
                }
            }
        }
        // Sort by timestamp in descending order
        return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    catch (error) {
        console.error('Error fetching bot activities:', error);
        throw error;
    }
}
