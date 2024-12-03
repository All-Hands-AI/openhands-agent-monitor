import { isSuccessComment } from './github-api';

// Original version of isSuccessComment
function originalIsSuccessComment(comment: any): boolean {
  if (!comment.user || (comment.user.login !== 'github-actions[bot]' && comment.user.login !== 'openhands-agent')) return false;
  const lowerBody = comment.body.toLowerCase();
  return lowerBody.includes('a potential fix has been generated and a draft pr') ||
    lowerBody.includes('openhands made the following changes to resolve the issues') ||
    lowerBody.includes('successfully fixed') ||
    lowerBody.includes('updated pull request');
}

// Test data from real GitHub issues
const issue5363Comment = {
  id: 2511702756,
  html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/5363#issuecomment-2511702756',
  created_at: '2024-12-02T14:32:19Z',
  user: {
    login: 'github-actions[bot]',
    type: 'Bot'
  },
  body: 'A potential fix has been generated and a draft PR #5364 has been created. Please review the changes.'
};

const issue5343Comment = {
  id: 2509919118,
  html_url: 'https://github.com/All-Hands-AI/OpenHands/issues/5343#issuecomment-2509919118',
  created_at: '2024-12-01T16:17:26Z',
  user: {
    login: 'github-actions[bot]',
    type: 'Bot'
  },
  body: 'A potential fix has been generated and a draft PR #5344 has been created. Please review the changes.'
};

console.log('Testing issue 5363 comment:');
console.log('Original function:', originalIsSuccessComment(issue5363Comment));
console.log('New function:', isSuccessComment(issue5363Comment));

console.log('\nTesting issue 5343 comment:');
console.log('Original function:', originalIsSuccessComment(issue5343Comment));
console.log('New function:', isSuccessComment(issue5343Comment));