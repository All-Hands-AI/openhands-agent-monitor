import { BotActivity, IssueActivityStatus } from '../types';

async function checkPRStatus(prUrl: string): Promise<IssueActivityStatus> {
  try {
    const response = await fetch(prUrl);
    if (!response.ok) {
      return 'no_pr';
    }
    const pr = await response.json();
    
    if (pr.merged) {
      return 'pr_merged';
    } else if (pr.state === 'closed') {
      return 'pr_closed';
    } else {
      return 'pr_open';
    }
  } catch (error) {
    console.error('Error checking PR status:', error);
    return 'no_pr';
  }
}

export async function fetchBotActivities(since?: string): Promise<BotActivity[]> {
  try {
    const response = await fetch('/cache/bot-activities.json');
    if (!response.ok) {
      throw new Error(`Failed to load cached data: ${response.status.toString()} ${response.statusText}`);
    }

    const data = await response.json();
    let activities = data.activities as BotActivity[];

    // Filter by date if since is provided
    if (since !== undefined && since !== '') {
      const sinceDate = new Date(since).getTime();
      activities = activities.filter(activity => 
        new Date(activity.timestamp).getTime() >= sinceDate
      );
    }

    // Process issue activities to determine PR status
    const processedActivities = await Promise.all(activities.map(async activity => {
      if (activity.type === 'issue') {
        if (activity.prUrl) {
          const prStatus = await checkPRStatus(activity.prUrl);
          return { ...activity, status: prStatus };
        } else {
          return { ...activity, status: 'no_pr' as IssueActivityStatus };
        }
      }
      return activity;
    }));

    // Sort by timestamp in descending order
    return processedActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error fetching bot activities:', error);
    throw error;
  }
}