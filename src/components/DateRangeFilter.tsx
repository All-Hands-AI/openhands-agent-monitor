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
    } else if (start && end) {
      onDateRangeChange({ start, end });
    } else if (start) {
      onDateRangeChange({ start, end: new Date().toISOString().split('T')[0] });
    } else if (end) {
      onDateRangeChange({ start: '', end });
    }
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const end = event.target.value;
    const start = dateRange?.start || '';

    if (!end && !start) {
      onDateRangeChange(undefined);
    } else if (end && start) {
      onDateRangeChange({ start, end });
    } else if (end) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      onDateRangeChange({ start: thirtyDaysAgo.toISOString().split('T')[0], end });
    } else if (start) {
      onDateRangeChange({ start, end: '' });
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