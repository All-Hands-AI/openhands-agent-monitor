import { describe, it, expect } from 'vitest';
import { fetchBotActivities } from './github-api';

describe('fetchBotActivities', () => {
  it('should fetch activities from the last 90 days', async () => {
    const activities = await fetchBotActivities();
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    activities.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      expect(activityDate.getTime()).toBeGreaterThan(ninetyDaysAgo.getTime());
      expect(activityDate.getTime()).toBeLessThanOrEqual(now.getTime());
    });
  });

  it('should fetch activities since a specific date', async () => {
    const since = '2024-12-01T00:00:00Z';
    const activities = await fetchBotActivities(since);
    const sinceDate = new Date(since);
    const now = new Date();

    activities.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      expect(activityDate.getTime()).toBeGreaterThan(sinceDate.getTime());
      expect(activityDate.getTime()).toBeLessThanOrEqual(now.getTime());
    });
  });
});