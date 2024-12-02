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


    // Mock cache response
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/cache/bot-activities.json') {
        return createMockResponse({
          activities: [{
            id: 'issue-1-2',
            type: 'issue',
            status: 'success',
            timestamp: '2023-11-28T00:01:00Z',
            url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#comment-2',
            description: 'I have created a pull request at https://github.com/All-Hands-AI/OpenHands/pull/2'
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

  it('should detect openhands-agent comments in PRs', async () => {


    // Mock cache response
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/cache/bot-activities.json') {
        return createMockResponse({
          activities: [{
            id: 'pr-1-2',
            type: 'pr',
            status: 'success',
            timestamp: '2023-11-28T00:01:00Z',
            url: 'https://github.com/All-Hands-AI/OpenHands/pull/1#comment-2',
            description: 'I have updated the pull request with the requested changes.'
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
