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
  mark: { type: 'bar' };
  encoding: {
    x: {
      field: 'date';
      type: 'temporal';
      title: 'Date';
      axis?: {
        labelColor: string;
        titleColor: string;
        gridColor: string;
        domainColor: string;
      };
    };
    y: {
      aggregate: 'count';
      type: 'quantitative';
      title: 'Count';
      axis?: {
        labelColor: string;
        titleColor: string;
        gridColor: string;
        domainColor: string;
      };
    };
    color: {
      field: 'status';
      type: 'nominal';
      title: 'Status';
      scale?: {
        domain: string[];
        range: string[];
      };
      legend?: {
        labelColor: string;
        titleColor: string;
      };
    };
  };
  width: number;
  height: number;
  title: string | { text: string; color: string };
  background?: string;
  config?: {
    view: {
      stroke: string;
    };
  };
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
    mark: { type: 'bar' },
    encoding: {
      x: {
        field: 'date',
        type: 'temporal',
        title: 'Date',
        axis: {
          labelColor: '#C4CBDA',
          titleColor: '#C4CBDA',
          gridColor: '#3c3c4a',
          domainColor: '#3c3c4a'
        }
      },
      y: {
        aggregate: 'count',
        type: 'quantitative',
        title: 'Count',
        axis: {
          labelColor: '#C4CBDA',
          titleColor: '#C4CBDA',
          gridColor: '#3c3c4a',
          domainColor: '#3c3c4a'
        }
      },
      color: {
        field: 'status',
        type: 'nominal',
        title: 'Status',
        scale: type === 'issue' ? {
          domain: ['no_pr', 'pr_open', 'pr_merged', 'pr_closed'],
          range: ['#ffffff', '#4caf50', '#9c27b0', '#f44336']  // White, Green, Purple, Red
        } : {
          domain: ['success', 'failure'],
          range: ['#22c55e', '#ef4444']  // Green for success, Red for failure
        },
        legend: {
          labelColor: '#C4CBDA',
          titleColor: '#C4CBDA'
        }
      },
    },
    width: 400,
    height: 300,
    background: '#1f2228',
    title: {
      text: `${type.toUpperCase()} Activity Over Time`,
      color: '#C4CBDA'
    },
    config: {
      view: {
        stroke: 'transparent'
      }
    }
  };

  return <VegaLite spec={spec} />;
}