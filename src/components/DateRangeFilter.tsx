import { useState, useEffect } from 'react';
import { DateRange } from '../types';

interface DateRangeFilterProps {
  dateRange?: DateRange | undefined;
  onDateRangeChange: (dateRange?: DateRange) => void;
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps): React.JSX.Element {
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const defaultRange = getDefaultDateRange();
  const [start, setStart] = useState(dateRange?.start ?? defaultRange.start);
  const [end, setEnd] = useState(dateRange?.end ?? defaultRange.end);

  useEffect(() => {
    if (dateRange === undefined) {
      const defaultRange = getDefaultDateRange();
      setStart(defaultRange.start);
      setEnd(defaultRange.end);
      onDateRangeChange(defaultRange);
    } else {
      setStart(dateRange.start);
      setEnd(dateRange.end);
    }
  }, [dateRange, onDateRangeChange]);

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newStart = event.target.value;
    setStart(newStart);

    if (newStart === '' && end === '') {
      onDateRangeChange(undefined);
    } else {
      onDateRangeChange({ start: newStart, end });
    }
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newEnd = event.target.value;
    setEnd(newEnd);

    if (start === '' && newEnd === '') {
      onDateRangeChange(undefined);
    } else {
      onDateRangeChange({ start, end: newEnd });
    }
  };

  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <div className="date-range-filter">
      <div className="filter-group">
        <label htmlFor="start-date">From:</label>
        <input
          type="date"
          id="start-date"
          value={start}
          onChange={handleStartDateChange}
          max={maxDate}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="end-date">To:</label>
        <input
          type="date"
          id="end-date"
          value={end}
          onChange={handleEndDateChange}
          max={maxDate}
        />
      </div>
    </div>
  );
}