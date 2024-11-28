import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityChart } from './ActivityChart';
import { BotActivity } from '../types';

// Mock react-vega since it's a complex visualization component
vi.mock('react-vega', () => ({
  VegaLite: vi.fn(() => <div data-testid="vega-lite-chart" />),
}));

describe('ActivityChart', () => {
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
      type: 'issue',
      status: 'failure',
      timestamp: '2023-11-28T13:00:00Z',
      url: 'https://github.com/example/2',
      description: 'Failed to resolve issue',
    },
  ];

  it('renders chart component', () => {
    const { getByTestId } = render(
      <ActivityChart activities={mockActivities} type="issue" />
    );

    expect(getByTestId('vega-lite-chart')).toBeInTheDocument();
  });
});