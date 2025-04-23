import { TopLevelSpec } from 'vega-lite';
import { ChartDefinition, ChartCategory } from '../../types/chart';
import { applyChartStyle } from '../../utils/chartStyles';

export const barComparison: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: [
      { category: 'A', value: 28 },
      { category: 'B', value: 55 },
      { category: 'C', value: 43 },
      { category: 'D', value: 91 },
      { category: 'E', value: 81 }
    ]
  },
  mark: 'bar',
  encoding: {
    x: { field: 'category', type: 'nominal' },
    y: { field: 'value', type: 'quantitative' }
  }
};

export const groupedBarChart: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: [
      { category: 'A', group: 'Group 1', value: 28 },
      { category: 'B', group: 'Group 1', value: 55 },
      { category: 'C', group: 'Group 1', value: 43 },
      { category: 'A', group: 'Group 2', value: 41 },
      { category: 'B', group: 'Group 2', value: 63 },
      { category: 'C', group: 'Group 2', value: 35 }
    ]
  },
  mark: 'bar',
  encoding: {
    x: { field: 'category', type: 'nominal' },
    y: { field: 'value', type: 'quantitative' },
    color: { field: 'group', type: 'nominal' },
    xOffset: { field: 'group', type: 'nominal' }
  }
};

export const comparisonCharts: ChartDefinition[] = [
  {
    id: 'simple-bar-comparison',
    title: 'Bar Chart Comparison',
    category: ChartCategory.Comparison,
    description: 'Compare values across categories',
    tags: ['bar', 'comparison', 'categorical'],
    spec: applyChartStyle({
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 400,
      height: 300,
      data: {
        values: [
          { category: 'A', value: 28 },
          { category: 'B', value: 55 },
          { category: 'C', value: 43 },
          { category: 'D', value: 91 },
          { category: 'E', value: 81 }
        ]
      },
      mark: { type: 'bar', tooltip: true },
      encoding: {
        x: { field: 'category', type: 'nominal', axis: { labelAngle: 0 } },
        y: { field: 'value', type: 'quantitative', axis: { grid: true } },
        color: { value: '#4C78A8' }
      }
    })
  },
  {
    id: 'grouped-bar-chart',
    title: 'Grouped Bar Chart',
    category: ChartCategory.Comparison,
    description: 'Compare values across categories and groups',
    tags: ['bar', 'comparison', 'categorical', 'grouped'],
    spec: {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 400,
      height: 300,
      data: {
        values: [
          { category: 'A', group: 'Group 1', value: 28 },
          { category: 'B', group: 'Group 1', value: 55 },
          { category: 'C', group: 'Group 1', value: 43 },
          { category: 'A', group: 'Group 2', value: 41 },
          { category: 'B', group: 'Group 2', value: 63 },
          { category: 'C', group: 'Group 2', value: 35 }
        ]
      },
      mark: { type: 'bar', tooltip: true },
      encoding: {
        x: { field: 'category', type: 'nominal', axis: { labelAngle: 0 } },
        y: { field: 'value', type: 'quantitative', axis: { grid: true } },
        color: { field: 'group', type: 'nominal', scale: { scheme: 'category10' } },
        xOffset: { field: 'group', type: 'nominal' }
      }
    }
  }
];

export const comparison = {
  'bar-comparison': barComparison,
  'grouped-bar': groupedBarChart
}; 