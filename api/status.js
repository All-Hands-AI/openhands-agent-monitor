export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');

    const statusPath = join('public/cache/status.json');
    const status = JSON.parse(await readFile(statusPath, 'utf8'));

    return res.status(200).json(status);
  } catch (error) {
    console.error('Failed to read status:', error);
    return res.status(500).json({
      error: 'Failed to read cache status',
      details: error.message
    });
  }
}