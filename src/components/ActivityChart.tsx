import { useMemo } from 'react';
import { VegaLite } from 'react-vega';
import { VisualizationSpec } from 'vega-lite';
import { BotActivity, ActivityType } from '../types';

interface ActivityChartProps {
  activities: BotActivity[];
  type: ActivityType;
}

export function ActivityChart({ activities, type }: ActivityChartProps): JSX.Element {
  const spec: VisualizationSpec = useMemo(() => ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: activities
        .filter(a => a.type === type)
        .map(a => ({
          date: a.timestamp.split('T')[0],
          status: a.status,
        })),
    },
    mark: { type: 'line' } as const,
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