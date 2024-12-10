import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchBotActivities } from './github-api';
import type { GitHubPR } from './types';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

// Mock fs
vi.mock('fs', () => ({
  default: {
    appendFileSync: vi.fn()
  },
  appendFileSync: vi.fn()
}));

describe('PR status handling', () => {
  let fetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetch = vi.mocked(await import('node-fetch')).default;
    fetch.mockReset();
    process.env.GITHUB_TOKEN = 'test-token';
  });

  it('should handle PR states correctly', async () => {
    // Mock PR with comments
    const mockPR: GitHubPR = {
      number: 123,
      title: 'Test PR',
      html_url: 'https://github.com/All-Hands-AI/OpenHands/pull/123',
      comments_url: 'https://api.github.com/repos/All-Hands-AI/OpenHands/issues/123/comments',
      comments: 2,
      body: 'Test PR description'
    };

    // Mock comments indicating bot activity
    const mockComments = [
      {
        id: 1,
        body: 'OpenHands started fixing the issue',
        html_url: 'https://github.com/All-Hands-AI/OpenHands/pull/123#comment-1',
        created_at: '2024-01-01T00:00:00Z',
        user: { login: 'openhands-agent' }
      },
      {
        id: 2,
        body: 'A potential fix has been generated',
        html_url: 'https://github.com/All-Hands-AI/OpenHands/pull/123#comment-2',
        created_at: '2024-01-01T00:01:00Z',
        user: { login: 'openhands-agent' }
      }
    ];

    // Test different PR states
    const prStates = [
      { state: 'open', merged: false, expectedStatus: 'pr_open' },
      { state: 'closed', merged: true, expectedStatus: 'pr_merged' },
      { state: 'closed', merged: false, expectedStatus: 'pr_closed' }
    ];

    for (const { state, merged, expectedStatus } of prStates) {
      // Mock API responses
      fetch.mockImplementation((url: string) => {
        if (url.includes('/comments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockComments),
            headers: { get: () => null }
          });
        } else if (url.includes('/pulls/123')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ...mockPR, state, merged }),
            headers: { get: () => null }
          });
        } else if (url.includes('/issues')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ ...mockPR, pull_request: {} }]),
            headers: { get: () => null }
          });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });

      const activities = await fetchBotActivities();
      expect(activities).toHaveLength(1);
      expect(activities[0].status).toBe(expectedStatus);
      expect(activities[0].type).toBe('pr');
    }
  });

  it('should handle no PR case correctly', async () => {
    // Mock PR with comments where bot failed to create PR
    const mockPR: GitHubPR = {
      number: 123,
      title: 'Test PR',
      html_url: 'https://github.com/All-Hands-AI/OpenHands/pull/123',
      comments_url: 'https://api.github.com/repos/All-Hands-AI/OpenHands/issues/123/comments',
      comments: 2,
      body: 'Test PR description'
    };

    // Mock comments indicating bot failure
    const mockComments = [
      {
        id: 1,
        body: 'OpenHands started fixing the issue',
        html_url: 'https://github.com/All-Hands-AI/OpenHands/pull/123#comment-1',
        created_at: '2024-01-01T00:00:00Z',
        user: { login: 'openhands-agent' }
      },
      {
        id: 2,
        body: 'The workflow to fix this issue encountered an error',
        html_url: 'https://github.com/All-Hands-AI/OpenHands/pull/123#comment-2',
        created_at: '2024-01-01T00:01:00Z',
        user: { login: 'openhands-agent' }
      }
    ];

    // Mock API responses
    fetch.mockImplementation((url: string) => {
      if (url.includes('/comments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockComments),
          headers: { get: () => null }
        });
      } else if (url.includes('/pulls/123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockPR, state: 'open', merged: false }),
          headers: { get: () => null }
        });
      } else if (url.includes('/issues')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ ...mockPR, pull_request: {} }]),
          headers: { get: () => null }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const activities = await fetchBotActivities();
    expect(activities).toHaveLength(1);
    expect(activities[0].status).toBe('no_pr');
    expect(activities[0].type).toBe('pr');
  });
});