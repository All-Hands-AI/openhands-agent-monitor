export type ActivityType = 'issue' | 'pr';
export type ActivityStatus = 'success' | 'failure';

export interface BotActivity {
  id: string;
  type: ActivityType;
  status: ActivityStatus;
  timestamp: string;
  url: string;
  description: string;
}

export interface ActivityFilter {
  type?: ActivityType;
  status?: ActivityStatus;
  dateRange?: {
    start: string;
    end: string;
  };
}