import { useState, useEffect, useCallback } from 'react';
import { ActivityList } from './components/ActivityList';
import { ActivityFilter } from './components/ActivityFilter';
import { DateRangeFilter } from './components/DateRangeFilter';
import { ActivityChart } from './components/ActivityChart';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { ActivityFilter as FilterType, DateRange, AppState } from './types';
import { fetchBotActivities } from './services/github';
import './App.css';

function App(): React.JSX.Element {
  const [state, setState] = useState<AppState>({
    activities: [],
    loading: true,
    error: null,
    filter: {},
  });

  const loadActivities = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const since = state.filter.dateRange?.start;
      const activities = await fetchBotActivities(since);
      setState(prev => ({ ...prev, activities, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred while fetching activities',
      }));
    }
  }, [state.filter.dateRange?.start]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  const handleFilterChange = (filter: FilterType): void => {
    setState(prev => ({ ...prev, filter }));
  };

  const handleDateRangeChange = (dateRange?: DateRange): void => {
    setState(prev => ({
      ...prev,
      filter: {
        ...prev.filter,
        dateRange,
      },
    }));
  };

  const handleRetry = (): void => {
    void loadActivities();
  };

  const filteredActivities = state.activities.filter((activity) => {
    if (state.filter.type && activity.type !== state.filter.type) return false;
    if (state.filter.status && activity.status !== state.filter.status) return false;
    if (state.filter.dateRange && state.filter.dateRange.start && state.filter.dateRange.end) {
      const activityDate = new Date(activity.timestamp);
      const startDate = new Date(state.filter.dateRange.start);
      const endDate = new Date(state.filter.dateRange.end);
      if (activityDate < startDate || activityDate > endDate) return false;
    }
    return true;
  });

  return (
    <div className="app">
      <div className="app-header">
        <img src="/logo.png" alt="OpenHands Logo" className="app-logo" />
        <h1>Bot Activity Monitor</h1>
      </div>
      
      <section className="filters">
        <h2>Filters</h2>
        <ActivityFilter
          filter={state.filter}
          onFilterChange={handleFilterChange}
        />
        <DateRangeFilter
          dateRange={state.filter.dateRange}
          onDateRangeChange={handleDateRangeChange}
        />
      </section>

      {state.loading ? (
        <LoadingSpinner />
      ) : state.error !== null ? (
        <ErrorMessage
          message={state.error}
          onRetry={handleRetry}
        />
      ) : (
        <>
          <section className="charts">
            <h2>Activity Charts</h2>
            <div className="chart-container">
              <ActivityChart activities={filteredActivities} type="issue" />
              <ActivityChart activities={filteredActivities} type="pr" />
            </div>
          </section>

          <section className="activity-list">
            <h2>Activity List</h2>
            <ActivityList activities={filteredActivities} />
          </section>
        </>
      )}
    </div>
  );
}

export default App;
