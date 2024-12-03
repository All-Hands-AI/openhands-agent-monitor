import { describe, it, expect } from 'vitest';
import { isSuccessComment } from './github-api';

describe('isSuccessComment', () => {
  it('should identify success comments correctly', () => {
    const successComments = [
      {
        user: { login: 'github-actions[bot]', type: 'Bot' },
        body: 'A potential fix has been generated and a draft PR #5364 has been created. Please review the changes.'
      },
      {
        user: { login: 'github-actions[bot]', type: 'Bot' },
        body: 'A potential fix has been generated and a draft PR #5344 has been created. Please review the changes.'
      },
      {
        user: { login: 'openhands-agent' },
        body: 'OpenHands made the following changes to resolve the issues'
      },
      {
        user: { login: 'openhands-agent' },
        body: 'Successfully fixed the issue'
      },
      {
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
        user: { login: 'github-actions[bot]', type: 'Bot' },
        body: '[OpenHands](https://github.com/All-Hands-AI/OpenHands) started fixing the issue!'
      },
      {
        user: { login: 'openhands-agent' },
        body: 'The workflow to fix this issue encountered an error'
      },
      {
        user: { login: 'regular-user' },
        body: 'A potential fix has been generated and a draft PR has been created'
      }
    ];

    nonSuccessComments.forEach(comment => {
      expect(isSuccessComment(comment)).toBe(false);
    });
  });
});