export interface GitHubComment {
  id: number;
  body: string;
  html_url: string;
  created_at: string;
  user: {
    login: string;
    type?: string;
  };
}

export interface GitHubIssue {
  number: number;
  title: string;
  html_url: string;
  comments_url: string;
  comments: number;
  pull_request?: unknown;
  body: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  html_url: string;
  comments_url: string;
  comments: number;
  body?: string;
}

export interface ApiResponse {
  data: any[];
  hasNextPage: boolean;
  nextUrl: string | null;
}

export interface Activity {
  id: string;
  type: 'issue' | 'pr';
  status: 'success' | 'failure';
  timestamp: string;
  url: string;
  title: string;
  description: string;
}