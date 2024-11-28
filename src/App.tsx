import { useState } from 'react';
import { ActivityList } from './components/ActivityList';
import { ActivityFilter } from './components/ActivityFilter';
import { ActivityChart } from './components/ActivityChart';
import { ActivityFilter as FilterType, BotActivity } from './types';
import './App.css';

function App() {
  const [activities] = useState<BotActivity[]>([]);
  const [filter, setFilter] = useState<FilterType>({});

  const filteredActivities = activities.filter((activity) => {
    if (filter.type && activity.type !== filter.type) return false;
    if (filter.status && activity.status !== filter.status) return false;
    if (filter.dateRange) {
      const activityDate = new Date(activity.timestamp);
      const startDate = new Date(filter.dateRange.start);
      const endDate = new Date(filter.dateRange.end);
      if (activityDate < startDate || activityDate > endDate) return false;
    }
    return true;
  });

  return (
    <div className="app">
      <h1>OpenHands Bot Activity Monitor</h1>
      
      <section className="filters">
        <h2>Filters</h2>
        <ActivityFilter filter={filter} onFilterChange={setFilter} />
      </section>

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
    </div>
  );
}

export default App;
