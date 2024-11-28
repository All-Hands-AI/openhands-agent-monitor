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
            <span className="activity-type">{activity.type.toUpperCase()}</span>
            <span className="activity-status">{activity.status}</span>
            <span className="activity-time">{new Date(activity.timestamp).toLocaleString()}</span>
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