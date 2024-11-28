import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActivityList } from './ActivityList';
import { BotActivity } from '../types';

describe('ActivityList', () => {
  const mockActivities: BotActivity[] = [
    {
      id: '1',
      type: 'issue',
      status: 'success',
      timestamp: '2023-11-28T12:00:00Z',
      url: 'https://github.com/example/1',
      description: 'Successfully resolved issue',
    },
    {
      id: '2',
      type: 'pr',
      status: 'failure',
      timestamp: '2023-11-28T13:00:00Z',
      url: 'https://github.com/example/2',
      description: 'Failed to modify PR',
    },
  ];

  it('renders activities correctly', () => {
    render(<ActivityList activities={mockActivities} />);

    // Check if activities are rendered
    expect(screen.getByText('ISSUE')).toBeInTheDocument();
    expect(screen.getByText('PR')).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByText('failure')).toBeInTheDocument();
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
});