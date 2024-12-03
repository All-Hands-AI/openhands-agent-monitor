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

  it('should detect openhands-agent comments in issues', async () => {
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
            description: 'A potential fix has been generated and a draft PR #2 has been created. Please review the changes.'
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
      status: 'success',
      id: expect.stringContaining('issue-1') as string,
    });

    // Restore the original fetch
    vi.unstubAllGlobals();
  });

  it('should detect openhands-agent failure comments in issues', async () => {
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
      status: 'failure',
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

  it('should fetch fresh data when cache is stale', async () => {
    vi.useFakeTimers();
    // Mock two consecutive fetch calls with different data
    const mockFetch = vi.fn()
      .mockImplementationOnce((url: string) => {
        if (url === '/cache/bot-activities.json') {
          return createMockResponse({
            activities: [{
              id: 'issue-1-2',
              type: 'issue',
              status: 'success',
              timestamp: '2023-11-28T00:01:00Z',
              url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#comment-2',
              description: 'A potential fix has been generated and a draft PR #2 has been created.'
            }],
            lastUpdated: new Date(Date.now() - 5000).toISOString() // 5 seconds ago
          });
        }
        throw new Error(`Unexpected URL: ${url}`);
      })
      .mockImplementationOnce((url: string) => {
        if (url === '/cache/bot-activities.json') {
          return createMockResponse({
            activities: [{
              id: 'issue-1-2',
              type: 'issue',
              status: 'success',
              timestamp: '2023-11-28T00:01:00Z',
              url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#comment-2',
              description: 'A potential fix has been generated and a draft PR #2 has been created.'
            }, {
              id: 'issue-2-1',
              type: 'issue',
              status: 'success',
              timestamp: '2023-11-28T00:02:00Z',
              url: 'https://github.com/All-Hands-AI/OpenHands/issues/2#comment-1',
              description: 'Another issue fixed'
            }],
            lastUpdated: new Date().toISOString()
          });
        }
        throw new Error(`Unexpected URL: ${url}`);
      });
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);

    // First fetch
    const activities1 = await fetchBotActivities();
    expect(activities1).toHaveLength(1);

    // Wait 5 seconds
    vi.advanceTimersByTime(5000);

    // Second fetch should get new data
    const activities2 = await fetchBotActivities();
    expect(activities2).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Restore the original fetch and timers
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});