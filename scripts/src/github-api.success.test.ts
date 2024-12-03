import { describe, it, expect } from 'vitest';
import { isSuccessComment } from './github-api';

describe('isSuccessComment', () => {
  it('should identify success comments correctly', () => {
    const successComments = [
      {
        id: 2511702756,
        html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/5363#issuecomment-2511702756',
        created_at: '2024-12-02T14:32:19Z',
        user: { login: 'github-actions[bot]', type: 'Bot' },
        body: 'A potential fix has been generated and a draft PR #5364 has been created. Please review the changes.'
      },
      {
        id: 2509919118,
        html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/5343#issuecomment-2509919118',
        created_at: '2024-12-01T16:17:26Z',
        user: { login: 'github-actions[bot]', type: 'Bot' },
        body: 'A potential fix has been generated and a draft PR #5344 has been created. Please review the changes.'
      },
      {
        id: 1,
        html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/1#issuecomment-1',
        created_at: '2024-12-01T00:00:00Z',
        user: { login: 'openhands-agent' },
        body: 'OpenHands made the following changes to resolve the issues'
      },
      {
        id: 2,
        html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/2#issuecomment-2',
        created_at: '2024-12-01T00:00:00Z',
        user: { login: 'openhands-agent' },
        body: 'Successfully fixed the issue'
      },
      {
        id: 3,
        html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/3#issuecomment-3',
        created_at: '2024-12-01T00:00:00Z',
        user: { login: 'openhands-agent' },
        body: 'Updated pull request'
      }
    ];

    successComments.forEach(comment => {
      expect(isSuccessComment(comment)).toBe(true);
    });
  });

  it('should not identify non-success comments as success', () => {
    const nonSuccessComments = [
      {
        id: 4,
        html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/4#issuecomment-4',
        created_at: '2024-12-01T00:00:00Z',
        user: { login: 'github-actions[bot]', type: 'Bot' },
        body: '[OpenHands](https://github.com/All-Hands-AI/OpenHands) started fixing the issue!'
      },
      {
        id: 5,
        html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/5#issuecomment-5',
        created_at: '2024-12-01T00:00:00Z',
        user: { login: 'openhands-agent' },
        body: 'The workflow to fix this issue encountered an error'
      },
      {
        id: 6,
        html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/6#issuecomment-6',
        created_at: '2024-12-01T00:00:00Z',
        user: { login: 'regular-user' },
        body: 'A potential fix has been generated and a draft PR has been created'
      }
    ];

    nonSuccessComments.forEach(comment => {
      expect(isSuccessComment(comment)).toBe(false);
    });
  });
});