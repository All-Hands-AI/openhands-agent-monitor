import { useMemo } from 'react';
import { VegaLite } from 'react-vega';

import { BotActivity, ActivityType } from '../types';

interface ActivityChartProps {
  activities: BotActivity[];
  type: ActivityType;
}

interface ChartData {
  date: string;
  status: string;
}

type ChartSpec = {
  $schema: string;
  data: { values: ChartData[] };
  mark: { type: 'line' };
  encoding: {
    x: { field: 'date'; type: 'temporal'; title: 'Date' };
    y: { aggregate: 'count'; type: 'quantitative'; title: 'Count' };
    color: { field: 'status'; type: 'nominal'; title: 'Status' };
  };
  width: number;
  height: number;
  title: string;
}

export function ActivityChart({ activities, type }: ActivityChartProps): React.JSX.Element {
  const chartData = useMemo((): ChartData[] => {
    return activities
      .filter(a => a.type === type)
      .map(a => {
        const [date] = a.timestamp.split('T');
        if (date === undefined || date === '') {
          throw new Error('Invalid timestamp format');
        }
        return {
          date,
          status: a.status,
        };
      });
  }, [activities, type]);

  const spec: ChartSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: chartData },
    mark: { type: 'line' },
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
        scale: {
          domain: ['success', 'failure'],
          range: ['#22c55e', '#ef4444']  // Green for success, Red for failure
        }
      },
    },
    width: 500,
    height: 300,
    title: `${type.toUpperCase()} Activity Over Time`,
  };

  return <VegaLite spec={spec} />;
}