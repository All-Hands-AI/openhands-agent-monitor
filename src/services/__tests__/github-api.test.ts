import { isSuccessComment, isFailureComment } from '../../../scripts/src/github-api';
import type { GitHubComment } from '../../../scripts/src/types';

describe('GitHub API Comment Detection', () => {
  const createBotComment = (body: string, type: string = 'Bot'): GitHubComment => ({
    id: 1,
    body,
    html_url: 'https://github.com/example/comment',
    created_at: '2024-12-03T00:00:00Z',
    user: {
      login: 'github-actions[bot]',
      type
    }
  });

  describe('isSuccessComment', () => {
    it('should detect PR creation success comments', () => {
      const comment = createBotComment('A potential fix has been generated and a draft PR #5364 has been created. Please review the changes.');
      expect(isSuccessComment(comment)).toBe(true);
    });

    it('should detect changes made success comments', () => {
      const comment = createBotComment('OpenHands made the following changes to resolve the issues');
      expect(isSuccessComment(comment)).toBe(true);
    });

    it('should detect successfully fixed comments', () => {
      const comment = createBotComment('Successfully fixed the issue');
      expect(isSuccessComment(comment)).toBe(true);
    });

    it('should detect updated PR comments', () => {
      const comment = createBotComment('Updated pull request with the latest changes');
      expect(isSuccessComment(comment)).toBe(true);
    });

    it('should not detect non-success comments', () => {
      const comment = createBotComment('Started fixing the issue');
      expect(isSuccessComment(comment)).toBe(false);
    });

    it('should not detect non-bot comments', () => {
      const comment = createBotComment('A potential fix has been generated', 'User');
      expect(isSuccessComment(comment)).toBe(false);
    });
  });

  describe('isFailureComment', () => {
    it('should detect error comments', () => {
      const comment = createBotComment('The workflow to fix this issue encountered an error');
      expect(isFailureComment(comment)).toBe(true);
    });

    it('should detect failed to create changes comments', () => {
      const comment = createBotComment('OpenHands failed to create any code changes');
      expect(isFailureComment(comment)).toBe(true);
    });

    it('should detect unsuccessful fix comments', () => {
      const comment = createBotComment('An attempt was made to automatically fix this issue, but it was unsuccessful');
      expect(isFailureComment(comment)).toBe(true);
    });

    it('should not detect non-failure comments', () => {
      const comment = createBotComment('Started fixing the issue');
      expect(isFailureComment(comment)).toBe(false);
    });

    it('should not detect non-bot comments', () => {
      const comment = createBotComment('The workflow encountered an error', 'User');
      expect(isFailureComment(comment)).toBe(false);
    });
  });
});