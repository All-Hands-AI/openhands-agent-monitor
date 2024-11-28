import { useMemo } from 'react';
import { VegaLite } from 'react-vega';
import { BotActivity, ActivityType } from '../types';

interface ActivityChartProps {
  activities: BotActivity[];
  type: ActivityType;
}

export function ActivityChart({ activities, type }: ActivityChartProps) {
  const spec = useMemo(() => ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: activities
        .filter(a => a.type === type)
        .map(a => ({
          date: a.timestamp.split('T')[0],
          status: a.status,
        })),
    },
    mark: 'line',
    encoding: {
      x: {
        field: 'date',
        type: 'temporal',
        title: 'Date',
      },
      y: {
        aggregate: 'count',
        type: 'quantitative',
        title: 'Count',
      },
      color: {
        field: 'status',
        type: 'nominal',
        title: 'Status',
      },
    },
    width: 500,
    height: 300,
    title: `${type.toUpperCase()} Activity Over Time`,
  }), [activities, type]);

  return <VegaLite spec={spec} />;
}