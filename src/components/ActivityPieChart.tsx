import { useMemo } from 'react';
import { VegaLite } from 'react-vega';

import { BotActivity, ActivityType } from '../types';

interface ActivityPieChartProps {
  activities: BotActivity[];
  type: ActivityType;
}

interface ChartData {
  status: string;
  count: number;
}

type ChartSpec = {
  $schema: string;
  data: { values: ChartData[] };
  mark: { type: 'arc'; innerRadius: number };
  encoding: {
    theta: {
      field: 'count';
      type: 'quantitative';
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

export function ActivityPieChart({ activities, type }: ActivityPieChartProps): React.JSX.Element {
  const chartData = useMemo((): ChartData[] => {
    const filteredActivities = activities.filter(a => a.type === type);
    const statusCounts = new Map<string, number>();
    
    filteredActivities.forEach(activity => {
      const count = statusCounts.get(activity.status) || 0;
      statusCounts.set(activity.status, count + 1);
    });

    return Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    }));
  }, [activities, type]);

  const spec: ChartSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: chartData },
    mark: { type: 'arc', innerRadius: 50 },
    encoding: {
      theta: {
        field: 'count',
        type: 'quantitative'
      },
      color: {
        field: 'status',
        type: 'nominal',
        title: 'Status',
        scale: type === 'issue' ? {
          domain: ['no_pr', 'pr_open', 'pr_merged', 'pr_closed'],
          range: ['#ffffff', '#4caf50', '#9c27b0', '#f44336']
        } : {
          domain: ['success', 'failure'],
          range: ['#22c55e', '#ef4444']
        },
        legend: {
          labelColor: '#C4CBDA',
          titleColor: '#C4CBDA'
        }
      },
    },
    width: 300,
    height: 300,
    background: '#1f2228',
    title: {
      text: `Total ${type.toUpperCase()} Status Distribution`,
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