import { describe, it, expect, vi } from 'vitest';
import { isSuccessComment, isPRModificationFailureComment, fetchBotActivities } from './github-api';
import type { GitHubComment, GitHubPR } from './types';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

// Mock fs
vi.mock('fs', () => ({
  appendFileSync: vi.fn()
}));

describe('Comment detection', () => {
  it('should detect issue success comment', () => {
    const comment: GitHubComment = {
      id: 1,
      html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#comment-1',
      created_at: '2023-11-28T00:01:00Z',
      user: { login: 'github-actions[bot]', type: 'Bot' },
      body: 'A potential fix has been generated and a draft PR #5364 has been created. Please review the changes.',
    };
    expect(isSuccessComment(comment)).toBe(true);
  });

  it('should detect PR failure comment', () => {
    const comment: GitHubComment = {
      id: 1,
      html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#comment-1',
      created_at: '2023-11-28T00:01:00Z',
      user: { login: 'github-actions[bot]', type: 'Bot' },
      body: 'The workflow to fix this issue encountered an error. Please check the workflow logs for more information.',
    };
    expect(isPRModificationFailureComment(comment)).toBe(true);
  });
});