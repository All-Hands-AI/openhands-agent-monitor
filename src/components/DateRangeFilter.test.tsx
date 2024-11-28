import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DateRangeFilter } from './DateRangeFilter';
import { DateRange } from '../types';

describe('DateRangeFilter', () => {
  const mockDateRange: DateRange = {
    start: '2023-11-01',
    end: '2023-11-30',
  };
  const mockOnDateRangeChange = vi.fn();

  beforeEach(() => {
    mockOnDateRangeChange.mockClear();
  });

  it('renders date inputs with provided values', () => {
    render(
      <DateRangeFilter
        dateRange={mockDateRange}
        onDateRangeChange={mockOnDateRangeChange}
      />
    );

    const startInput = screen.getByLabelText('From:') as HTMLInputElement;
    const endInput = screen.getByLabelText('To:') as HTMLInputElement;

    expect(startInput.value).toBe('2023-11-01');
    expect(endInput.value).toBe('2023-11-30');
  });

  it('handles start date changes', () => {
    render(
      <DateRangeFilter
        dateRange={mockDateRange}
        onDateRangeChange={mockOnDateRangeChange}
      />
    );

    const startInput = screen.getByLabelText('From:');
    fireEvent.change(startInput, { target: { value: '2023-11-15' } });

    expect(mockOnDateRangeChange).toHaveBeenCalledWith({
      start: '2023-11-15',
      end: '2023-11-30',
    });
  });

  it('handles end date changes', () => {
    render(
      <DateRangeFilter
        dateRange={mockDateRange}
        onDateRangeChange={mockOnDateRangeChange}
      />
    );

    const endInput = screen.getByLabelText('To:');
    fireEvent.change(endInput, { target: { value: '2023-11-20' } });

    expect(mockOnDateRangeChange).toHaveBeenCalledWith({
      start: '2023-11-01',
      end: '2023-11-20',
    });
  });

  it('handles clearing dates', () => {
    render(
      <DateRangeFilter
        dateRange={mockDateRange}
        onDateRangeChange={mockOnDateRangeChange}
      />
    );

    const startInput = screen.getByLabelText('From:');
    const endInput = screen.getByLabelText('To:');

    // Clear both inputs at once
    fireEvent.change(startInput, { target: { value: '' } });
    fireEvent.change(endInput, { target: { value: '' } });

    // Verify that undefined was called at some point
    expect(mockOnDateRangeChange).toHaveBeenCalledWith(undefined);
  });
});