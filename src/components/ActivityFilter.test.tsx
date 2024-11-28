import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityFilter } from './ActivityFilter';
import { ActivityFilter as FilterType } from '../types';

describe('ActivityFilter', () => {
  const mockFilter: FilterType = {};
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    mockOnFilterChange.mockClear();
  });

  it('renders filter options correctly', () => {
    render(<ActivityFilter filter={mockFilter} onFilterChange={mockOnFilterChange} />);

    expect(screen.getByLabelText('Type:')).toBeInTheDocument();
    expect(screen.getByLabelText('Status:')).toBeInTheDocument();
  });

  it('handles type filter changes', () => {
    render(<ActivityFilter filter={mockFilter} onFilterChange={mockOnFilterChange} />);

    const typeSelect = screen.getByLabelText('Type:');
    fireEvent.change(typeSelect, { target: { value: 'issue' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockFilter,
      type: 'issue',
    });
  });

  it('handles status filter changes', () => {
    render(<ActivityFilter filter={mockFilter} onFilterChange={mockOnFilterChange} />);

    const statusSelect = screen.getByLabelText('Status:');
    fireEvent.change(statusSelect, { target: { value: 'success' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockFilter,
      status: 'success',
    });
  });

  it('clears filters when selecting "All"', () => {
    const initialFilter: FilterType = {
      type: 'issue',
      status: 'success',
    };

    render(<ActivityFilter filter={initialFilter} onFilterChange={mockOnFilterChange} />);

    const typeSelect = screen.getByLabelText('Type:');
    fireEvent.change(typeSelect, { target: { value: '' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...initialFilter,
      type: undefined,
    });
  });
});