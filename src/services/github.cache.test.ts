import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fetchBotActivities } from './github';
import { BotActivity } from '../types';

// Mock environment variables
const originalEnv = process.env;

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GitHub Service Cache', () => {
  const mockActivities: BotActivity[] = [
    {
      id: 'test-1',
      type: 'issue',
      status: 'success',
      timestamp: '2023-12-01T12:00:00Z',
      url: 'https://github.com/test/1',
      description: 'Test activity 1'
    },
    {
      id: 'test-2',
      type: 'pr',
      status: 'failure',
      timestamp: '2023-12-01T13:00:00Z',
      url: 'https://github.com/test/2',
      description: 'Test activity 2'
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    
    // Mock process.cwd()
    vi.spyOn(process, 'cwd').mockReturnValue('/test');

    // Reset environment
    process.env = { ...originalEnv };
    process.env.VITE_GITHUB_TOKEN = 'test-token';
    process.env.VITE_USE_CACHE = 'true';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Cache Usage', () => {
    it('should use cache when VITE_USE_CACHE is true and valid cache exists', async () => {
      // Enable cache
      process.env.VITE_USE_CACHE = 'true';

      // Mock cache file existence
      vi.mocked(fs.existsSync).mockReturnValue(true);

      // Mock cache content
      const cacheContent = {
        timestamp: new Date().toISOString(),
        activities: mockActivities
      };
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cacheContent));

      const activities = await fetchBotActivities();

      // Verify cache was used
      expect(fs.existsSync).toHaveBeenCalledWith(path.join('/test', '.cache', 'github-activities.json'));
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(activities).toEqual(mockActivities);
    });

    it('should not use cache when VITE_USE_CACHE is false', async () => {
      // Reset mocks before changing environment
      vi.resetAllMocks();

      // Disable cache
      process.env.VITE_USE_CACHE = 'false';

      // Mock API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        headers: {
          get: () => null
        }
      });

      await fetchBotActivities();

      // Verify cache was not used
      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should fallback to API when cache is expired', async () => {
      // Enable cache
      process.env.VITE_USE_CACHE = 'true';

      // Mock cache file existence
      vi.mocked(fs.existsSync).mockReturnValue(true);

      // Mock expired cache content (25 hours old)
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25);
      const cacheContent = {
        timestamp: oldDate.toISOString(),
        activities: mockActivities
      };
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(cacheContent));

      // Mock API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        headers: {
          get: () => null
        }
      });

      await fetchBotActivities();

      // Verify API was called after finding expired cache
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle missing cache file', async () => {
      // Enable cache
      process.env.VITE_USE_CACHE = 'true';

      // Mock cache file not existing
      vi.mocked(fs.existsSync).mockReturnValue(false);

      // Mock API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        headers: {
          get: () => null
        }
      });

      await fetchBotActivities();

      // Verify fallback to API
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle invalid cache JSON', async () => {
      // Enable cache
      process.env.VITE_USE_CACHE = 'true';

      // Mock cache file existence
      vi.mocked(fs.existsSync).mockReturnValue(true);

      // Mock invalid JSON in cache
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

      // Mock API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        headers: {
          get: () => null
        }
      });

      await fetchBotActivities();

      // Verify fallback to API
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});