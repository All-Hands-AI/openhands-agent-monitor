import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import path from 'path';
import { BotActivity } from '../src/types';

// Mock environment variables
const originalEnv = process.env;

// Mock fs module
import * as fs from 'fs';
vi.mock('fs');

const mockFs = fs as unknown as {
  existsSync: MockInstance;
  mkdirSync: MockInstance;
  writeFileSync: MockInstance;
};

// Mock fetch
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: {
    get: () => null
  },
  json: () => Promise.resolve([])
});
vi.stubGlobal('fetch', mockFetch);

// Mock the github service
const mockActivities: BotActivity[] = [{
  id: 'test-1',
  type: 'issue',
  status: 'success',
  timestamp: '2023-12-01T12:00:00Z',
  url: 'https://github.com/test/1',
  description: 'Test activity 1'
}];

vi.mock('./github', () => ({
  fetchBotActivities: vi.fn().mockResolvedValue(mockActivities)
}));

describe('Cache Building Script', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    
    // Mock process.cwd()
    vi.spyOn(process, 'cwd').mockReturnValue('/test');

    // Reset environment
    process.env = { ...originalEnv };
    process.env.VITE_GITHUB_TOKEN = 'test-token';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create cache directory if it does not exist', async () => {
    // Mock cache directory not existing
    mockFs.existsSync.mockReturnValue(false);

    // Import the buildCache function
    const { buildCache } = await import('./build-cache');
    const result = await buildCache();

    // Verify cache directory was created
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(path.join('/test', '.cache'), { recursive: true });
    expect(result).toBe(true);
  });

  it('should write cache file with fetched data', async () => {
    // Mock cache directory existing
    mockFs.existsSync.mockReturnValue(true);

    // Mock writeFileSync to capture the written data
    let writtenData: string | undefined;
    mockFs.writeFileSync.mockImplementation((_path: string, data: string) => {
      writtenData = data;
    });

    // Mock fetchBotActivities to return our mock data
    const { fetchBotActivities } = await import('./github');
    vi.mocked(fetchBotActivities).mockResolvedValueOnce(mockActivities);

    // Import the buildCache function
    const { buildCache } = await import('./build-cache');
    const result = await buildCache();

    // Verify cache file was written
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      path.join('/test', '.cache', 'github-activities.json'),
      expect.any(String)
    );

    // Verify cache content structure
    expect(writtenData).toBeDefined();
    if (writtenData) {
      const cacheContent = JSON.parse(writtenData);
      expect(cacheContent).toHaveProperty('timestamp');
      expect(cacheContent).toHaveProperty('activities');
      expect(cacheContent.activities).toEqual(mockActivities);
      expect(new Date(cacheContent.timestamp as string)).toBeInstanceOf(Date);
    }
    expect(result).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    // Mock fetchBotActivities to throw an error
    const { fetchBotActivities } = await import('./github');
    vi.mocked(fetchBotActivities).mockRejectedValueOnce(new Error('API Error'));

    // Import the buildCache function
    const { buildCache } = await import('./build-cache');
    const result = await buildCache();

    // Verify error handling
    expect(result).toBe(false);
  });
});