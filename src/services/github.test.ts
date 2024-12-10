/**
 * Unit tests for the GitHub service.
 * 
 * These tests use mocked API responses to verify the service's behavior
 * without making actual network requests. They focus on testing:
 * 
 * 1. Comment detection logic for both issues and PRs
 * 2. Success/failure status determination
 * 3. Activity data structure and formatting
 * 
 * The tests use Vitest's mocking capabilities to simulate GitHub API responses.
 */

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

  it('should detect openhands-agent comments in issues with PR', async () => {
    // Mock cache response for issue success
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/cache/bot-activities.json') {
        return createMockResponse({
          activities: [{
            id: 'issue-1-2',
            type: 'issue',
            status: 'success',
            timestamp: '2023-11-28T00:01:00Z',
            url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#comment-2',
            prUrl: 'https://api.github.com/repos/All-Hands-AI/OpenHands/pulls/2',
            description: 'A potential fix has been generated and a draft PR #2 has been created. Please review the changes.'
          }],
          lastUpdated: '2023-11-28T00:01:00Z'
        });
      } else if (url === 'https://api.github.com/repos/All-Hands-AI/OpenHands/pulls/2') {
        return createMockResponse({
          state: 'open',
          merged: false
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);

    const activities = await fetchBotActivities();
    
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject<Partial<BotActivity>>({
      type: 'issue',
      status: 'pr_open',
      id: expect.stringContaining('issue-1') as string,
    });

    // Restore the original fetch
    vi.unstubAllGlobals();
  });

  it('should detect openhands-agent failure comments in issues without PR', async () => {
    // Mock cache response for issue failure
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/cache/bot-activities.json') {
        return createMockResponse({
          activities: [{
            id: 'issue-1-2',
            type: 'issue',
            status: 'failure',
            timestamp: '2023-11-28T00:01:00Z',
            url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#comment-2',
            description: 'The workflow to fix this issue encountered an error. Openhands failed to create any code changes.'
          }],
          lastUpdated: '2023-11-28T00:01:00Z'
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);

    const activities = await fetchBotActivities();
    
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject<Partial<BotActivity>>({
      type: 'issue',
      status: 'no_pr',
      id: expect.stringContaining('issue-1') as string,
    });

    // Restore the original fetch
    vi.unstubAllGlobals();
  });

  it('should detect openhands-agent failure comments in PRs', async () => {
    // Mock cache response for PR failure
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/cache/bot-activities.json') {
        return createMockResponse({
          activities: [{
            id: 'pr-1-2',
            type: 'pr',
            status: 'failure',
            timestamp: '2023-11-28T00:01:00Z',
            url: 'https://github.com/All-Hands-AI/OpenHands/pull/1#comment-2',
            description: 'The workflow to fix this issue encountered an error. Openhands failed to create any code changes.'
          }],
          lastUpdated: '2023-11-28T00:01:00Z'
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);

    const activities = await fetchBotActivities();
    
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject<Partial<BotActivity>>({
      type: 'pr',
      status: 'failure',
      id: expect.stringContaining('pr-1') as string,
    });

    // Restore the original fetch
    vi.unstubAllGlobals();
  });

  it('should handle issue with no PR', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/cache/bot-activities.json') {
        return createMockResponse({
          activities: [{
            id: 'issue-1-2',
            type: 'issue',
            status: 'success',
            timestamp: '2023-11-28T00:01:00Z',
            url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#comment-2',
            description: 'Working on the issue...'
          }],
          lastUpdated: '2023-11-28T00:01:00Z'
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);

    const activities = await fetchBotActivities();
    
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject<Partial<BotActivity>>({
      type: 'issue',
      status: 'no_pr',
    });

    vi.unstubAllGlobals();
  });

  it('should handle issue with open PR', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/cache/bot-activities.json') {
        return createMockResponse({
          activities: [{
            id: 'issue-1-2',
            type: 'issue',
            status: 'success',
            timestamp: '2023-11-28T00:01:00Z',
            url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#comment-2',
            prUrl: 'https://api.github.com/repos/All-Hands-AI/OpenHands/pulls/2',
            description: 'Created PR #2'
          }],
          lastUpdated: '2023-11-28T00:01:00Z'
        });
      } else if (url === 'https://api.github.com/repos/All-Hands-AI/OpenHands/pulls/2') {
        return createMockResponse({
          state: 'open',
          merged: false
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);

    const activities = await fetchBotActivities();
    
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject<Partial<BotActivity>>({
      type: 'issue',
      status: 'pr_open',
    });

    vi.unstubAllGlobals();
  });

  it('should handle issue with merged PR', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/cache/bot-activities.json') {
        return createMockResponse({
          activities: [{
            id: 'issue-1-2',
            type: 'issue',
            status: 'success',
            timestamp: '2023-11-28T00:01:00Z',
            url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#comment-2',
            prUrl: 'https://api.github.com/repos/All-Hands-AI/OpenHands/pulls/2',
            description: 'Created PR #2'
          }],
          lastUpdated: '2023-11-28T00:01:00Z'
        });
      } else if (url === 'https://api.github.com/repos/All-Hands-AI/OpenHands/pulls/2') {
        return createMockResponse({
          state: 'closed',
          merged: true
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);

    const activities = await fetchBotActivities();
    
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject<Partial<BotActivity>>({
      type: 'issue',
      status: 'pr_merged',
    });

    vi.unstubAllGlobals();
  });

  it('should handle issue with closed PR', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/cache/bot-activities.json') {
        return createMockResponse({
          activities: [{
            id: 'issue-1-2',
            type: 'issue',
            status: 'success',
            timestamp: '2023-11-28T00:01:00Z',
            url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#comment-2',
            prUrl: 'https://api.github.com/repos/All-Hands-AI/OpenHands/pulls/2',
            description: 'Created PR #2'
          }],
          lastUpdated: '2023-11-28T00:01:00Z'
        });
      } else if (url === 'https://api.github.com/repos/All-Hands-AI/OpenHands/pulls/2') {
        return createMockResponse({
          state: 'closed',
          merged: false
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);

    const activities = await fetchBotActivities();
    
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject<Partial<BotActivity>>({
      type: 'issue',
      status: 'pr_closed',
    });

    vi.unstubAllGlobals();
  });

  it('should detect openhands-agent comments in PRs', async () => {
    // Mock cache response for PR success
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/cache/bot-activities.json') {
        return createMockResponse({
          activities: [{
            id: 'pr-1-2',
            type: 'pr',
            status: 'success',
            timestamp: '2023-11-28T00:01:00Z',
            url: 'https://github.com/All-Hands-AI/OpenHands/pull/1#comment-2',
            description: 'OpenHands made the following changes to resolve the issues:\n\n- Fixed the bug in the code\n\nUpdated pull request https://github.com/All-Hands-AI/OpenHands/pull/1 with new patches.'
          }],
          lastUpdated: '2023-11-28T00:01:00Z'
        });
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