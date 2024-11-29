/**
 * Integration tests for the GitHub service.
 * 
 * These tests interact with the real GitHub API and require authentication.
 * They are not meant to be run in CI, but rather locally or in a controlled environment.
 * 
 * Prerequisites:
 * - A valid GitHub token with repo scope must be set in VITE_GITHUB_TOKEN environment variable
 * - The token must have access to the All-Hands-AI/OpenHands repository
 * 
 * To run these tests:
 * 1. Create a .env file in the project root with:
 *    VITE_GITHUB_TOKEN=your_github_token
 * 2. Run the integration tests:
 *    npm run test:integration
 * 
 * Note: These tests may take longer to run due to API rate limits and network latency.
 * They also depend on the actual state of the repository, so results may vary.
 */

import { describe, it, expect } from 'vitest';
import { fetchBotActivities as fetchBotActivitiesOriginal } from '../services/github';
import { fetchBotActivities as fetchBotActivitiesOptimized } from '../services/github.optimized';
import type { BotActivity } from '../types';

describe('GitHub Service Integration Tests', () => {
  // Skip these tests if VITE_GITHUB_TOKEN is not set
  const runTest = import.meta.env['VITE_GITHUB_TOKEN'] !== undefined && import.meta.env['VITE_GITHUB_TOKEN'] !== '' ? it : it.skip;

  runTest('should fetch real bot activities from OpenHands repository', async () => {
    // Helper function to validate activities
    const validateActivities = (activities: BotActivity[]) => {
      expect(activities.length).toBeGreaterThan(0);

      const expectedFields: Record<keyof BotActivity, unknown> = {
        id: expect.any(String),
        type: expect.stringMatching(/^(issue|pr)$/),
        status: expect.stringMatching(/^(success|failure)$/),
        timestamp: expect.any(String),
        url: expect.stringMatching(/^https:\/\/github\.com\//),
        description: expect.any(String),
      };

      for (const activity of activities) {
        expect(activity).toMatchObject(expectedFields);
        expect(new Date(activity.timestamp).toString()).not.toBe('Invalid Date');
        expect(activity.url).toContain('All-Hands-AI/OpenHands');
      }

      return {
        issueCount: activities.filter(a => a.type === 'issue').length,
        prCount: activities.filter(a => a.type === 'pr').length,
        successCount: activities.filter(a => a.status === 'success').length,
        failureCount: activities.filter(a => a.status === 'failure').length,
      };
    };

    // Test original implementation
    console.log('\nTesting original implementation:');
    const startOriginal = Date.now();
    const activitiesOriginal = await fetchBotActivitiesOriginal();
    const timeOriginal = Date.now() - startOriginal;
    const statsOriginal = validateActivities(activitiesOriginal);
    
    console.log(`Time taken: ${timeOriginal}ms`);
    console.log(`Found ${activitiesOriginal.length.toString()} activities:`);
    console.log(`- Issues: ${statsOriginal.issueCount.toString()}`);
    console.log(`- PRs: ${statsOriginal.prCount.toString()}`);
    console.log(`- Successes: ${statsOriginal.successCount.toString()}`);
    console.log(`- Failures: ${statsOriginal.failureCount.toString()}`);

    // Test optimized implementation
    console.log('\nTesting optimized implementation:');
    const startOptimized = Date.now();
    const activitiesOptimized = await fetchBotActivitiesOptimized();
    const timeOptimized = Date.now() - startOptimized;
    const statsOptimized = validateActivities(activitiesOptimized);
    
    console.log(`Time taken: ${timeOptimized}ms`);
    console.log(`Found ${activitiesOptimized.length.toString()} activities:`);
    console.log(`- Issues: ${statsOptimized.issueCount.toString()}`);
    console.log(`- PRs: ${statsOptimized.prCount.toString()}`);
    console.log(`- Successes: ${statsOptimized.successCount.toString()}`);
    console.log(`- Failures: ${statsOptimized.failureCount.toString()}`);

    // Compare results
    console.log('\nComparison:');
    console.log(`Time difference: ${timeOriginal - timeOptimized}ms (${Math.round((timeOriginal - timeOptimized) / timeOriginal * 100)}% improvement)`);
    expect(activitiesOptimized.length).toBe(activitiesOriginal.length);
    expect(statsOptimized).toEqual(statsOriginal);

    // Print sample activities for manual verification
    if (activitiesOriginal.length > 0) {
      console.log('\nSample activity from original:', JSON.stringify(activitiesOriginal[0], null, 2));
      console.log('\nSample activity from optimized:', JSON.stringify(activitiesOptimized[0], null, 2));
    }
  }, 300000); // Increase timeout to 5 minutes for testing both implementations
});
