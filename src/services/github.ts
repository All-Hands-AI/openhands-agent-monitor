import { BotActivity } from '../types';

export async function fetchBotActivities(since?: string): Promise<BotActivity[]> {
  try {
    const response = await fetch('/cache/bot-activities.json');
    if (!response.ok) {
      throw new Error(`Failed to load cached data: ${response.status} ${response.statusText}`);
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

    // Sort by timestamp in descending order
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error fetching bot activities:', error);
    throw error;
  }
}