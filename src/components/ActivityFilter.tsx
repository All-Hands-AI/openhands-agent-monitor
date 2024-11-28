import { ActivityFilter as FilterType, ActivityStatus, ActivityType } from '../types';

interface ActivityFilterProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function ActivityFilter({ filter, onFilterChange }: ActivityFilterProps) {
  const handleTypeChange = (type: ActivityType | '') => {
    onFilterChange({
      ...filter,
      type: type || undefined,
    });
  };

  const handleStatusChange = (status: ActivityStatus | '') => {
    onFilterChange({
      ...filter,
      status: status || undefined,
    });
  };

  return (
    <div className="activity-filter">
      <div className="filter-group">
        <label htmlFor="type-filter">Type:</label>
        <select
          id="type-filter"
          value={filter.type || ''}
          onChange={(e) => handleTypeChange(e.target.value as ActivityType | '')}
        >
          <option value="">All</option>
          <option value="issue">Issue</option>
          <option value="pr">PR</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="status-filter">Status:</label>
        <select
          id="status-filter"
          value={filter.status || ''}
          onChange={(e) => handleStatusChange(e.target.value as ActivityStatus | '')}
        >
          <option value="">All</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
      </div>
    </div>
  );
}