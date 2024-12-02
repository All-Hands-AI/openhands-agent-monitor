import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';


// Mock environment variables
const originalEnv = process.env;

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the github service
const mockActivities = [{
  id: 'test-1',
  type: 'issue',
  status: 'success',
  timestamp: '2023-12-01T12:00:00Z',
  url: 'https://github.com/test/1',
  description: 'Test activity 1'
}];

const mockFetchBotActivities = vi.fn().mockResolvedValue(mockActivities);
vi.mock('../src/services/github', () => ({
  fetchBotActivities: mockFetchBotActivities
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
    vi.mocked(fs.existsSync).mockReturnValue(false);

    // Import the buildCache function
    const { buildCache } = await import('./build-cache');
    const result = await buildCache();

    // Verify cache directory was created
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join('/test', '.cache'), { recursive: true });
    expect(result).toBe(true);
  });

  it('should write cache file with fetched data', async () => {
    // Mock cache directory existing
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // Mock writeFileSync to capture the written data
    let writtenData: string | undefined;
    vi.mocked(fs.writeFileSync).mockImplementation((path, data) => {
      writtenData = data as string;
    });

    // Mock fetchBotActivities to return our mock data
    mockFetchBotActivities.mockResolvedValueOnce(mockActivities);

    // Import the buildCache function
    const { buildCache } = await import('./build-cache');
    const result = await buildCache();

    // Verify cache file was written
    expect(fs.writeFileSync).toHaveBeenCalledWith(
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
    const { fetchBotActivities } = await import('../src/services/github');
    vi.mocked(fetchBotActivities).mockRejectedValueOnce(new Error('API Error'));

    // Import the buildCache function
    const { buildCache } = await import('./build-cache');
    const result = await buildCache();

    // Verify error handling
    expect(result).toBe(false);
  });
});