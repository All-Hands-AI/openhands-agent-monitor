export type ActivityType = 'issue' | 'pr';
export type PRStatus = 'no_pr' | 'pr_open' | 'pr_merged' | 'pr_closed';
export type PRActivityStatus = 'success' | 'failure';
// This type is used in the ActivityStatus union type below
export type IssueActivityStatus = PRStatus;
export type ActivityStatus = PRActivityStatus | IssueActivityStatus;

export interface BotActivity {
  id: string;
  type: ActivityType;
  status: ActivityStatus;
  timestamp: string;
  url: string;
  title: string;
  description: string;
  prUrl?: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface ActivityFilter {
  type?: ActivityType | undefined;
  status?: ActivityStatus | undefined;
  dateRange?: DateRange | undefined;
}

export interface AppState {
  activities: BotActivity[];
  loading: boolean;
  error: string | null;
  filter: ActivityFilter;
}