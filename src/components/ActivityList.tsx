import { BotActivity, IssueActivityStatus } from '../types';
import { useState } from 'react';

interface ActivityListProps {
  activities: BotActivity[];
}

export function ActivityList({ activities }: ActivityListProps): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(activities.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = activities.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="activity-list">
        {currentActivities.map((activity) => (
          <div key={activity.id} className={`activity-item ${activity.type === 'issue' ? activity.status : activity.status}`}>
            <div className="activity-header">
              <span className="activity-title">{activity.title}</span>
            </div>
            <div className="activity-description">{activity.description}</div>
            <div className="activity-links">
              <a href={activity.url} target="_blank" rel="noopener noreferrer">
                View on GitHub
              </a>
              {activity.prUrl && (
                <>
                  {' | '}
                  <a href={activity.prUrl} target="_blank" rel="noopener noreferrer">
                    View PR
                  </a>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => { handlePageChange(currentPage - 1); }}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => { handlePageChange(currentPage + 1); }}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}