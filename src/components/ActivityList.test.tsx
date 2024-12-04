import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActivityList } from './ActivityList';
import { BotActivity } from '../types';

describe('ActivityList', () => {
  const createMockActivity = (id: string): BotActivity => ({
    id,
    type: 'issue',
    status: 'success',
    timestamp: '2023-11-28T12:00:00Z',
    url: `https://github.com/example/${id}`,
    title: `Test Issue ${id}`,
    description: `Description for issue ${id}`,
  });

  const mockActivities: BotActivity[] = [
    {
      id: '1',
      type: 'issue',
      status: 'success',
      timestamp: '2023-11-28T12:00:00Z',
      url: 'https://github.com/example/1',
      title: 'ISSUE success 11/28/2023, 12:00:00 PM -- Test Issue 1',
      description: 'Successfully resolved issue',
    },
    {
      id: '2',
      type: 'pr',
      status: 'failure',
      timestamp: '2023-11-28T13:00:00Z',
      url: 'https://github.com/example/2',
      title: 'PR failure 11/28/2023, 1:00:00 PM -- Test PR 1',
      description: 'Failed to modify PR',
    },
  ];

  it('renders activities correctly', () => {
    render(<ActivityList activities={mockActivities} />);

    // Check if activities are rendered
    expect(screen.getByText('ISSUE success 11/28/2023, 12:00:00 PM -- Test Issue 1')).toBeInTheDocument();
    expect(screen.getByText('PR failure 11/28/2023, 1:00:00 PM -- Test PR 1')).toBeInTheDocument();
    expect(screen.getByText('Successfully resolved issue')).toBeInTheDocument();
    expect(screen.getByText('Failed to modify PR')).toBeInTheDocument();

    // Check if links are rendered correctly
    const links = screen.getAllByText('View on GitHub');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://github.com/example/1');
    expect(links[1]).toHaveAttribute('href', 'https://github.com/example/2');
  });

  it('renders empty state correctly', () => {
    render(<ActivityList activities={[]} />);
    expect(screen.queryByText('View on GitHub')).not.toBeInTheDocument();
  });

  it('does not show pagination controls when there are 20 or fewer items', () => {
    const activities = Array.from({ length: 20 }, (_, i) => createMockActivity(String(i + 1)));
    render(<ActivityList activities={activities} />);
    
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
    expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
  });

  it('shows pagination controls when there are more than 20 items', () => {
    const activities = Array.from({ length: 25 }, (_, i) => createMockActivity(String(i + 1)));
    render(<ActivityList activities={activities} />);
    
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('shows only 20 items per page', () => {
    const activities = Array.from({ length: 25 }, (_, i) => createMockActivity(String(i + 1)));
    render(<ActivityList activities={activities} />);
    
    const items = screen.getAllByText(/Test Issue \d+/);
    expect(items).toHaveLength(20);
    expect(screen.getByText('Test Issue 1')).toBeInTheDocument();
    expect(screen.getByText('Test Issue 20')).toBeInTheDocument();
    expect(screen.queryByText('Test Issue 21')).not.toBeInTheDocument();
  });

  it('navigates between pages correctly', () => {
    const activities = Array.from({ length: 25 }, (_, i) => createMockActivity(String(i + 1)));
    render(<ActivityList activities={activities} />);
    
    // Initial page
    expect(screen.getByText('Test Issue 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Issue 21')).not.toBeInTheDocument();
    
    // Navigate to next page
    fireEvent.click(screen.getByText('Next'));
    expect(screen.queryByText('Test Issue 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test Issue 21')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    
    // Navigate back to first page
    fireEvent.click(screen.getByText('Previous'));
    expect(screen.getByText('Test Issue 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Issue 21')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('disables pagination buttons appropriately', () => {
    const activities = Array.from({ length: 25 }, (_, i) => createMockActivity(String(i + 1)));
    render(<ActivityList activities={activities} />);
    
    // On first page, Previous should be disabled
    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();
    
    // Navigate to last page
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Previous')).not.toBeDisabled();
    expect(screen.getByText('Next')).toBeDisabled();
  });
});