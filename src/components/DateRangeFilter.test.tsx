import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

    const startInput = screen.getByLabelText<HTMLInputElement>('From:');
    const endInput = screen.getByLabelText<HTMLInputElement>('To:');

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

    // Clear both inputs
    fireEvent.change(startInput, { target: { value: '' } });
    fireEvent.change(endInput, { target: { value: '' } });
    expect(mockOnDateRangeChange).toHaveBeenLastCalledWith(undefined);
  });

  it('initializes with default 7-day range when no dateRange is provided', () => {
    vi.useFakeTimers();
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const mockOnDateRangeChange = vi.fn();
    
    act(() => {
      render(
        <DateRangeFilter
          dateRange={undefined}
          onDateRangeChange={mockOnDateRangeChange}
        />
      );
    });

    const startInput = screen.getByLabelText<HTMLInputElement>('From:');
    const endInput = screen.getByLabelText<HTMLInputElement>('To:');

    // Check that inputs show 7-day range
    expect(startInput.value).toBe('2024-01-08');
    expect(endInput.value).toBe('2024-01-15');

    // Check that onDateRangeChange was called with default range
    expect(mockOnDateRangeChange).toHaveBeenCalledWith({
      start: '2024-01-08',
      end: '2024-01-15'
    });

    vi.useRealTimers();
  });

  it('maintains provided dateRange over default range', () => {
    const customDateRange = {
      start: '2024-01-01',
      end: '2024-01-31'
    };

    render(
      <DateRangeFilter
        dateRange={customDateRange}
        onDateRangeChange={mockOnDateRangeChange}
      />
    );

    const startInput = screen.getByLabelText<HTMLInputElement>('From:');
    const endInput = screen.getByLabelText<HTMLInputElement>('To:');

    expect(startInput.value).toBe('2024-01-01');
    expect(endInput.value).toBe('2024-01-31');
    expect(mockOnDateRangeChange).not.toHaveBeenCalled();
  });
});