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