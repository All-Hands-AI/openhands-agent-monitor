import { DateRange } from '../types';

interface DateRangeFilterProps {
  dateRange?: DateRange;
  onDateRangeChange: (dateRange?: DateRange) => void;
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const start = event.target.value;
    if (start && dateRange?.end) {
      onDateRangeChange({ start, end: dateRange.end });
    } else if (start) {
      onDateRangeChange({ start, end: new Date().toISOString().split('T')[0] });
    } else if (dateRange?.end) {
      onDateRangeChange({ start: '', end: dateRange.end });
    } else {
      onDateRangeChange(undefined);
    }
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const end = event.target.value;
    if (end && dateRange?.start) {
      onDateRangeChange({ start: dateRange.start, end });
    } else if (end) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      onDateRangeChange({ start: thirtyDaysAgo.toISOString().split('T')[0], end });
    } else if (dateRange?.start) {
      onDateRangeChange({ start: dateRange.start, end: '' });
    } else {
      onDateRangeChange(undefined);
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