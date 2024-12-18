interface CacheStatus {
  lastSuccessfulUpdate?: string;
  lastAttempt?: string;
  status: 'success' | 'error';
  activitiesCount?: number;
  error?: string;
}

async function checkCacheStatus(): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const statusPath = path.join(process.cwd(), 'public/cache/status.json');
    const cacheDataPath = path.join(process.cwd(), 'public/cache/bot-activities.json');
    
    // Read status file
    const statusData = JSON.parse(await fs.readFile(statusPath, 'utf8')) as CacheStatus;
    
    // Read cache file
    const cacheData = JSON.parse(await fs.readFile(cacheDataPath, 'utf8'));
    
    // Check cache freshness
    const lastUpdate = new Date(statusData.lastSuccessfulUpdate || 0);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    console.log('Cache Status Report:');
    console.log('-------------------');
    console.log(`Status: ${statusData.status}`);
    console.log(`Last Successful Update: ${statusData.lastSuccessfulUpdate || 'Never'}`);
    console.log(`Hours Since Last Update: ${hoursSinceUpdate.toFixed(2)}`);
    console.log(`Activities in Cache: ${cacheData.activities?.length || 0}`);
    
    if (statusData.error) {
      console.error('Last Error:', statusData.error);
    }
    
    // Alert if cache is stale
    if (hoursSinceUpdate > 12) {
      throw new Error(`Cache is stale! Last update was ${hoursSinceUpdate.toFixed(2)} hours ago`);
    }
    
    // Alert if no activities
    if (!cacheData.activities?.length) {
      throw new Error('Cache contains no activities!');
    }
    
    console.log('\nCache status is healthy ✓');
    
  } catch (error) {
    console.error('\nCache Health Check Failed!');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the check if this file is being run directly
if (require.main === module) {
  checkCacheStatus();
}