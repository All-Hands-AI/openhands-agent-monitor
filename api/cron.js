import { fetchBotActivities } from '../scripts/src/github-api';

export default async function handler(req, res) {
  console.log('Cron job started:', new Date().toISOString());
  
  try {
    if (req.method !== 'GET') {
      console.log('Invalid method:', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check authorization for GET requests
    const { authorization } = req.headers;
    if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('Unauthorized access attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Fetching bot activities...');
    const activities = await fetchBotActivities();
    
    // Store the cache in public/cache directory
    const cacheData = {
      activities,
      lastUpdated: new Date().toISOString()
    };

    // Write to a status file to track last successful update
    const statusData = {
      lastSuccessfulUpdate: new Date().toISOString(),
      activitiesCount: activities.length,
      status: 'success'
    };

    try {
      const { writeFile } = await import('fs/promises');
      const { join } = await import('path');
      
      // Ensure directories exist
      const { mkdir } = await import('fs/promises');
      await mkdir('public/cache', { recursive: true });
      
      // Write cache and status files
      await writeFile(
        join('public/cache/bot-activities.json'),
        JSON.stringify(cacheData, null, 2)
      );
      
      await writeFile(
        join('public/cache/status.json'),
        JSON.stringify(statusData, null, 2)
      );
      
      console.log('Cache files written successfully');
    } catch (fsError) {
      console.error('Failed to write cache files:', fsError);
      throw new Error('Failed to write cache files: ' + fsError.message);
    }

    console.log('Cron job completed successfully');
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      activitiesCount: activities.length
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    
    // Write error status
    try {
      const { writeFile } = await import('fs/promises');
      const { join } = await import('path');
      
      await writeFile(
        join('public/cache/status.json'),
        JSON.stringify({
          lastAttempt: new Date().toISOString(),
          status: 'error',
          error: error.message
        }, null, 2)
      );
    } catch (fsError) {
      console.error('Failed to write error status:', fsError);
    }

    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}