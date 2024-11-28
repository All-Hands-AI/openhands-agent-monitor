import { DateRange } from '../types';

interface DateRangeFilterProps {
  dateRange?: DateRange;
  onDateRangeChange: (dateRange?: DateRange) => void;
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const start = event.target.value;
    const end = dateRange?.end || '';

    if (!start && !end) {
      onDateRangeChange(undefined);
    } else {
      onDateRangeChange({ start, end });
    }
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const end = event.target.value;
    const start = dateRange?.start || '';

    if (!end && !start) {
      onDateRangeChange(undefined);
    } else {
      onDateRangeChange({ start, end });
    }
  };

  return (
    <div className="date-range-filter">
      <div className="filter-group">
        <label htmlFor="start-date">From:</label>
        <input
          type="date"
          id="start-date"
          value={dateRange?.start || ''}
          onChange={handleStartDateChange}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="end-date">To:</label>
        <input
          type="date"
          id="end-date"
          value={dateRange?.end || ''}
          onChange={handleEndDateChange}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>
    </div>
  );
}