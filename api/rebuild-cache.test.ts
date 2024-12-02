import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './rebuild-cache';

// Mock buildCache function
vi.mock('../scripts/build-cache', () => ({
  buildCache: vi.fn()
}));

describe('Rebuild Cache API', () => {
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockRes: VercelResponse;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.CRON_SECRET = 'test-secret';
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockRes = { status: mockStatus } as unknown as VercelResponse;
  });

  it('should return 401 if no authorization header is provided', async () => {
    const mockReq = {
      headers: {}
    } as unknown as VercelRequest;

    await handler(mockReq, mockRes);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 401 if authorization header is invalid', async () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer wrong-secret'
      }
    } as unknown as VercelRequest;

    await handler(mockReq, mockRes);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should rebuild cache successfully with valid authorization', async () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer test-secret'
      }
    } as unknown as VercelRequest;

    const { buildCache } = await import('../scripts/build-cache');
    vi.mocked(buildCache).mockResolvedValueOnce(true);

    await handler(mockReq, mockRes);

    expect(buildCache).toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({ message: 'Cache rebuilt successfully' });
  });

  it('should handle cache rebuild failure', async () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer test-secret'
      }
    } as unknown as VercelRequest;

    const { buildCache } = await import('../scripts/build-cache');
    vi.mocked(buildCache).mockResolvedValueOnce(false);

    await handler(mockReq, mockRes);

    expect(buildCache).toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to rebuild cache' });
  });

  it('should handle errors during cache rebuild', async () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer test-secret'
      }
    } as unknown as VercelRequest;

    const { buildCache } = await import('../scripts/build-cache');
    vi.mocked(buildCache).mockRejectedValueOnce(new Error('Test error'));

    await handler(mockReq, mockRes);

    expect(buildCache).toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});