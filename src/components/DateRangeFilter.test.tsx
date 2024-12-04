import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DateRangeFilter } from './DateRangeFilter';
import { DateRange } from '../types';
import { getComputedStyle } from '../test/testUtils';

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

  describe('dark theme styling', () => {
    beforeEach(() => {
      // Set up CSS variables for dark theme
      document.documentElement.style.setProperty('--bg-input', '#393939');
      document.documentElement.style.setProperty('--text-editor-active', '#C4CBDA');
      document.documentElement.style.setProperty('--border', '#3c3c4a');
    });

    it('applies dark theme styles to date inputs', () => {
      render(
        <DateRangeFilter
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      );

      // Check if the style rules exist with correct variables
      const styleRules = Array.from(document.styleSheets)
        .flatMap(sheet => Array.from(sheet.cssRules))
        .map(rule => rule.cssText)
        .join('\n');
      
      expect(styleRules).toContain('.filter-group input');
      expect(styleRules).toContain('var(--bg-input)');
      expect(styleRules).toContain('var(--text-editor-active)');
      expect(styleRules).toContain('var(--border)');
    });

    it('has proper spacing between filter groups', () => {
      render(
        <DateRangeFilter
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      );

      const filterGroups = document.querySelectorAll('.filter-group');
      const firstGroup = filterGroups[0] as HTMLElement;
      
      // Check gap between filter groups
      expect(getComputedStyle(firstGroup, 'gap')).toBe('0.5rem');
      expect(getComputedStyle(firstGroup, 'margin')).toBe('0.5rem');
    });

    it('has proper input padding and border radius', () => {
      render(
        <DateRangeFilter
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      );

      const startInput = screen.getByLabelText<HTMLInputElement>('From:');
      
      expect(getComputedStyle(startInput, 'padding')).toBe('0.5rem');
      expect(getComputedStyle(startInput, 'border-radius')).toBe('4px');
    });

    it('calendar picker indicator is visible in dark mode', () => {
      render(
        <DateRangeFilter
          dateRange={mockDateRange}
          onDateRangeChange={mockOnDateRangeChange}
        />
      );

      screen.getByLabelText<HTMLInputElement>('From:');
      
      // Check if the calendar picker indicator style exists
      const styleRules = Array.from(document.styleSheets)
        .flatMap(sheet => Array.from(sheet.cssRules))
        .map(rule => rule.cssText)
        .join('\n');
      
      expect(styleRules).toContain('::-webkit-calendar-picker-indicator');
      expect(styleRules).toContain('filter: invert(1)');
    });
  });
});