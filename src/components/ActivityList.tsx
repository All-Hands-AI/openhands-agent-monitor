import { BotActivity } from '../types';

interface ActivityListProps {
  activities: BotActivity[];
}

export function ActivityList({ activities }: ActivityListProps): React.JSX.Element {
  return (
    <div className="activity-list">
      {activities.map((activity) => (
        <div key={activity.id} className={`activity-item ${activity.status}`}>
          <div className="activity-header">
            <span className="activity-title">{activity.title}</span>
          </div>
          <div className="activity-description">{activity.description}</div>
          <a href={activity.url} target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </div>
      ))}
    </div>
  );
}