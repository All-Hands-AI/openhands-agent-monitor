import { BotActivity } from '../types';
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
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => { handlePageChange(currentPage - 1); }}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => { handlePageChange(currentPage + 1); }}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}