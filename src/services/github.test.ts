import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchBotActivities } from './github';
import type { BotActivity } from '../types';

describe('GitHub Service', () => {
  beforeEach(() => {
    // Mock the fetch function
    vi.stubGlobal('fetch', vi.fn());
  });

  function createMockResponse(data: unknown): Promise<Response> {
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(data),
      headers: new Headers()
    } as Response);
  }

  it('should detect openhands-agent comments in issues', async () => {
    const mockIssues = [
      {
        number: 1,
        html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/1',
        comments_url: 'https://api.github.com/repos/All-Hands-AI/OpenHands/issues/1/comments',
        comments: 2
      }
    ];

    const mockComments = [
      {
        id: '1',
        html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#comment-1',
        created_at: '2023-11-28T00:00:00Z',
        body: 'Hello! I will help you resolve this issue.',
        user: {
          login: 'openhands-agent',
          type: 'User'
        }
      },
      {
        id: '2',
        html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#comment-2',
        created_at: '2023-11-28T00:01:00Z',
        body: 'I have created a pull request at https://github.com/All-Hands-AI/OpenHands/pull/2',
        user: {
          login: 'openhands-agent',
          type: 'User'
        }
      }
    ];

    // Mock API responses
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/issues?')) {
        return createMockResponse(mockIssues);
      } else if (url.includes('/pulls?')) {
        return createMockResponse([]);  // Empty PRs
      } else if (url.includes('/issues/1/comments')) {
        return createMockResponse(mockComments);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);

    const activities = await fetchBotActivities();
    
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject<Partial<BotActivity>>({
      type: 'issue',
      status: 'success',
      id: expect.stringContaining('issue-1') as string,
    });

    // Restore the original fetch
    vi.unstubAllGlobals();
  });

  it('should detect openhands-agent comments in PRs', async () => {
    const mockPRs = [
      {
        number: 1,
        html_url: 'https://github.com/All-Hands-AI/OpenHands/pull/1',
        comments_url: 'https://api.github.com/repos/All-Hands-AI/OpenHands/pulls/1/comments',
        comments: 2
      }
    ];

    const mockComments = [
      {
        id: '1',
        html_url: 'https://github.com/All-Hands-AI/OpenHands/pull/1#comment-1',
        created_at: '2023-11-28T00:00:00Z',
        body: 'I will help you modify this pull request.',
        user: {
          login: 'openhands-agent',
          type: 'User'
        }
      },
      {
        id: '2',
        html_url: 'https://github.com/All-Hands-AI/OpenHands/pull/1#comment-2',
        created_at: '2023-11-28T00:01:00Z',
        body: 'I have successfully updated the pull request.',
        user: {
          login: 'openhands-agent',
          type: 'User'
        }
      }
    ];

    // Mock API responses
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/issues?')) {
        return createMockResponse([]);  // Empty issues
      } else if (url.includes('/pulls?')) {
        return createMockResponse(mockPRs);
      } else if (url.includes('/pulls/1/comments')) {
        return createMockResponse(mockComments);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);

    const activities = await fetchBotActivities();
    
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject<Partial<BotActivity>>({
      type: 'pr',
      status: 'success',
      id: expect.stringContaining('pr-1') as string,
    });

    // Restore the original fetch
    vi.unstubAllGlobals();
  });
});
