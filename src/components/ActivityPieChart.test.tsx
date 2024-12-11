import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityPieChart } from './ActivityPieChart';
import { BotActivity } from '../types';

// Mock VegaLite component and capture the spec prop
interface VegaLiteProps {
  spec: {
    data: { values: any[] };
    encoding: {
      theta: { field: string; type: string };
      color: { scale: { domain: string[]; range: string[] } };
    };
    title: { text: string; color: string };
  };
}

const mockVegaLite = vi.fn();
vi.mock('react-vega', () => ({
  VegaLite: (props: VegaLiteProps) => {
    mockVegaLite(props);
    return <div data-testid="vega-lite-pie-chart" />;
  },
}));

function getLastVegaLiteProps(): VegaLiteProps {
  expect(mockVegaLite).toHaveBeenCalled();
  const lastCall = mockVegaLite.mock.calls[mockVegaLite.mock.calls.length - 1][0];
  expect(lastCall).toBeDefined();
  return lastCall;
}

describe('ActivityPieChart', () => {
  const mockActivities: BotActivity[] = [
    {
      id: '1',
      type: 'issue',
      status: 'no_pr',
      timestamp: '2023-11-28T12:00:00Z',
      url: 'https://github.com/example/1',
      title: 'Test Issue 1',
      description: 'Issue without PR',
    },
    {
      id: '2',
      type: 'issue',
      status: 'pr_open',
      timestamp: '2023-11-28T13:00:00Z',
      url: 'https://github.com/example/2',
      title: 'Test Issue 2',
      description: 'Issue with open PR',
      prUrl: 'https://github.com/example/pr/2',
    },
    {
      id: '3',
      type: 'issue',
      status: 'pr_merged',
      timestamp: '2023-11-28T14:00:00Z',
      url: 'https://github.com/example/3',
      title: 'Test Issue 3',
      description: 'Issue with merged PR',
      prUrl: 'https://github.com/example/pr/3',
    },
    {
      id: '4',
      type: 'issue',
      status: 'pr_closed',
      timestamp: '2023-11-28T15:00:00Z',
      url: 'https://github.com/example/4',
      title: 'Test Issue 4',
      description: 'Issue with closed PR',
      prUrl: 'https://github.com/example/pr/4',
    },
    {
      id: '5',
      type: 'pr',
      status: 'success',
      timestamp: '2023-11-28T16:00:00Z',
      url: 'https://github.com/example/5',
      title: 'Test PR 1',
      description: 'Successful PR',
    },
    {
      id: '6',
      type: 'pr',
      status: 'failure',
      timestamp: '2023-11-28T17:00:00Z',
      url: 'https://github.com/example/6',
      title: 'Test PR 2',
      description: 'Failed PR',
    },
  ];

  it('renders pie chart component', () => {
    const { getByTestId } = render(
      <ActivityPieChart activities={mockActivities} type="issue" />
    );

    expect(getByTestId('vega-lite-pie-chart')).toBeInTheDocument();
  });

  it('aggregates data correctly for issues', () => {
    render(<ActivityPieChart activities={mockActivities} type="issue" />);
    const lastCall = getLastVegaLiteProps();
    const chartData = lastCall.spec.data.values;

    expect(chartData).toHaveLength(4);
    expect(chartData).toEqual(expect.arrayContaining([
      { status: 'no_pr', count: 1 },
      { status: 'pr_open', count: 1 },
      { status: 'pr_merged', count: 1 },
      { status: 'pr_closed', count: 1 }
    ]));
  });

  it('aggregates data correctly for PRs', () => {
    render(<ActivityPieChart activities={mockActivities} type="pr" />);
    const lastCall = getLastVegaLiteProps();
    const chartData = lastCall.spec.data.values;

    expect(chartData).toHaveLength(2);
    expect(chartData).toEqual(expect.arrayContaining([
      { status: 'success', count: 1 },
      { status: 'failure', count: 1 }
    ]));
  });

  it('configures issue color scale correctly', () => {
    render(<ActivityPieChart activities={mockActivities} type="issue" />);
    const lastCall = getLastVegaLiteProps();
    const colorScale = lastCall.spec.encoding.color.scale;

    expect(colorScale.domain).toEqual(['no_pr', 'pr_open', 'pr_merged', 'pr_closed']);
    expect(colorScale.range).toEqual(['#ffffff', '#4caf50', '#9c27b0', '#f44336']);
  });

  it('configures PR color scale correctly', () => {
    render(<ActivityPieChart activities={mockActivities} type="pr" />);
    const lastCall = getLastVegaLiteProps();
    const colorScale = lastCall.spec.encoding.color.scale;

    expect(colorScale.domain).toEqual(['success', 'failure']);
    expect(colorScale.range).toEqual(['#22c55e', '#ef4444']);
  });

  it('configures chart title correctly', () => {
    render(<ActivityPieChart activities={mockActivities} type="issue" />);
    const lastCall = getLastVegaLiteProps();
    const { title } = lastCall.spec;

    expect(title).toEqual({
      text: 'Total ISSUE Status Distribution',
      color: '#C4CBDA'
    });
  });
});