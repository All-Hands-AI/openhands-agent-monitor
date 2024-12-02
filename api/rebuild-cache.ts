import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildCache } from '../scripts/build-cache';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Verify cron secret to ensure only authorized calls can rebuild cache
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const success = await buildCache();
    if (success) {
      return res.status(200).json({ message: 'Cache rebuilt successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to rebuild cache' });
    }
  } catch (error) {
    console.error('Error rebuilding cache:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}