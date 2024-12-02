import { fetchBotActivities } from './github';
import fs from 'fs';
import path from 'path';

export async function buildCache() {
  try {
    // Create .cache directory if it doesn't exist
    const cacheDir = path.join(process.cwd(), '.cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Fetch all activities for the last 30 days
    console.log('Fetching bot activities...');
    const activities = await fetchBotActivities();

    // Save to cache file
    const cacheFile = path.join(cacheDir, 'github-activities.json');
    fs.writeFileSync(cacheFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      activities
    }, null, 2));

    console.log(`Cache built successfully at ${cacheFile}`);
    return true;
  } catch (error) {
    console.error('Error building cache:', error);
    return false;
  }
}

// Only run if this is the main module
if (process.argv[1] === import.meta.url.substring(7)) {
  buildCache().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}