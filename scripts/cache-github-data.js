import { fetchBotActivities } from '../src/services/github.js';
import fs from 'fs/promises';
import path from 'path';

async function cacheGitHubData() {
  try {
    // Fetch all activities for the last 30 days
    const activities = await fetchBotActivities();
    
    // Create cache directory if it doesn't exist
    const cacheDir = path.join(process.cwd(), 'public', 'cache');
    await fs.mkdir(cacheDir, { recursive: true });
    
    // Write activities to cache file
    const cacheFile = path.join(cacheDir, 'bot-activities.json');
    await fs.writeFile(cacheFile, JSON.stringify({
      activities,
      lastUpdated: new Date().toISOString()
    }, null, 2));
    
    console.log('Successfully cached GitHub data');
  } catch (error) {
    console.error('Error caching GitHub data:', error);
    process.exit(1);
  }
}

cacheGitHubData();