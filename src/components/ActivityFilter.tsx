import { ActivityFilter as FilterType, ActivityStatus, ActivityType } from '../types';

interface ActivityFilterProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function ActivityFilter({ filter, onFilterChange }: ActivityFilterProps): JSX.Element {
  const handleTypeChange = (type: ActivityType | ''): void => {
    onFilterChange({
      ...filter,
      type: type === '' ? undefined : type,
    });
  };

  const handleStatusChange = (status: ActivityStatus | ''): void => {
    onFilterChange({
      ...filter,
      status: status === '' ? undefined : status,
    });
  };

  const handleTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    handleTypeChange(e.target.value as ActivityType | '');
  };

  const handleStatusSelect = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    handleStatusChange(e.target.value as ActivityStatus | '');
  };

  return (
    <div className="activity-filter">
      <div className="filter-group">
        <label htmlFor="type-filter">Type:</label>
        <select
          id="type-filter"
          value={filter.type ?? ''}
          onChange={handleTypeSelect}
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
          value={filter.status ?? ''}
          onChange={handleStatusSelect}
        >
          <option value="">All</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
      </div>
    </div>
  );
}