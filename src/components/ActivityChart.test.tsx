import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityChart } from './ActivityChart';
import { BotActivity } from '../types';

// Mock VegaLite component and capture the spec prop
const mockVegaLite = vi.fn(() => <div data-testid="vega-lite-chart" />);
vi.mock('react-vega', () => ({
  VegaLite: (props: unknown) => {
    mockVegaLite(props);
    return <div data-testid="vega-lite-chart" />;
  },
}));

describe('ActivityChart', () => {
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

  it('renders chart component', () => {
    const { getByTestId } = render(
      <ActivityChart activities={mockActivities} type="issue" />
    );

    expect(getByTestId('vega-lite-chart')).toBeInTheDocument();
  });

  it('filters activities by type', () => {
    render(<ActivityChart activities={mockActivities} type="issue" />);
    const lastCall = mockVegaLite.mock.lastCall[0];
    const chartData = lastCall.spec.data.values;

    // Should only include issue activities
    expect(chartData).toHaveLength(4);
    expect(chartData.every((d: { date: string; status: string }) => 
      ['no_pr', 'pr_open', 'pr_merged', 'pr_closed'].includes(d.status)
    )).toBe(true);
  });

  it('configures issue color scale correctly', () => {
    render(<ActivityChart activities={mockActivities} type="issue" />);
    const lastCall = mockVegaLite.mock.lastCall[0];
    const colorScale = lastCall.spec.encoding.color.scale;

    expect(colorScale.domain).toEqual(['no_pr', 'pr_open', 'pr_merged', 'pr_closed']);
    expect(colorScale.range).toEqual(['#ffffff', '#4caf50', '#9c27b0', '#f44336']);
  });

  it('configures PR color scale correctly', () => {
    render(<ActivityChart activities={mockActivities} type="pr" />);
    const lastCall = mockVegaLite.mock.lastCall[0];
    const colorScale = lastCall.spec.encoding.color.scale;

    expect(colorScale.domain).toEqual(['success', 'failure']);
    expect(colorScale.range).toEqual(['#22c55e', '#ef4444']);
  });

  it('configures chart axes correctly', () => {
    render(<ActivityChart activities={mockActivities} type="issue" />);
    const lastCall = mockVegaLite.mock.lastCall[0];
    const { x, y } = lastCall.spec.encoding;

    expect(x.field).toBe('date');
    expect(x.type).toBe('temporal');
    expect(x.title).toBe('Date');
    expect(x.axis).toEqual({
      labelColor: '#C4CBDA',
      titleColor: '#C4CBDA',
      gridColor: '#3c3c4a',
      domainColor: '#3c3c4a'
    });

    expect(y.aggregate).toBe('count');
    expect(y.type).toBe('quantitative');
    expect(y.title).toBe('Count');
    expect(y.axis).toEqual({
      labelColor: '#C4CBDA',
      titleColor: '#C4CBDA',
      gridColor: '#3c3c4a',
      domainColor: '#3c3c4a'
    });
  });

  it('configures chart title correctly', () => {
    render(<ActivityChart activities={mockActivities} type="issue" />);
    const lastCall = mockVegaLite.mock.lastCall[0];
    const { title } = lastCall.spec;

    expect(title).toEqual({
      text: 'ISSUE Activity Over Time',
      color: '#C4CBDA'
    });
  });
});