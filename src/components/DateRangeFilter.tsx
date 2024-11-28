import { useState, useEffect } from 'react';
import { DateRange } from '../types';

interface DateRangeFilterProps {
  dateRange?: DateRange | undefined;
  onDateRangeChange: (dateRange?: DateRange) => void;
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps): React.JSX.Element {
  const [start, setStart] = useState(dateRange?.start ?? '');
  const [end, setEnd] = useState(dateRange?.end ?? '');

  useEffect(() => {
    setStart(dateRange?.start ?? '');
    setEnd(dateRange?.end ?? '');
  }, [dateRange]);

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