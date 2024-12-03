import { fetchBotActivities } from './github-api';
import fs from 'fs/promises';
import path from 'path';
import type { Activity } from './types';

interface CacheData {
  activities: Activity[];
  lastUpdated: string;
}

async function cacheGitHubData(): Promise<void> {
  try {
    // Fetch all activities for the last 30 days
    const activities = await fetchBotActivities();
    
    // Create cache directory if it doesn't exist
    const rootDir = path.resolve(process.cwd(), '..');
    const cacheDir = path.join(rootDir, 'public', 'cache');
    await fs.mkdir(cacheDir, { recursive: true });
    
    // Write activities to cache file
    const cacheFile = path.join(cacheDir, 'bot-activities.json');
    const cacheData: CacheData = {
      activities,
      lastUpdated: new Date().toISOString()
    };
    
    await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
    
    console.log('Successfully cached GitHub data');
  } catch (error) {
    console.error('Error caching GitHub data:', error);
    process.exit(1);
  }
}

cacheGitHubData();