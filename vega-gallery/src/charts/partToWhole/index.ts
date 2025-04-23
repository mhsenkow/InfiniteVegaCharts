import { TopLevelSpec } from 'vega-lite';

export const pieChart: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: [
      { category: 'A', value: 30 },
      { category: 'B', value: 20 },
      { category: 'C', value: 25 },
      { category: 'D', value: 25 }
    ]
  },
  mark: 'arc',
  encoding: {
    theta: { field: 'value', type: 'quantitative' },
    color: { field: 'category', type: 'nominal' }
  }
};

export const donutChart: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: [
      { category: 'A', value: 30 },
      { category: 'B', value: 20 },
      { category: 'C', value: 25 },
      { category: 'D', value: 25 }
    ]
  },
  mark: { 
    type: 'arc', 
    innerRadius: 50 
  },
  encoding: {
    theta: { field: 'value', type: 'quantitative' },
    color: { field: 'category', type: 'nominal' }
  }
};

export const stackedBar: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: [
      { category: 'A', group: 'Group 1', value: 28 },
      { category: 'B', group: 'Group 1', value: 55 },
      { category: 'C', group: 'Group 1', value: 43 }
    ]
  },
  mark: 'bar',
  encoding: {
    x: { field: 'category', type: 'nominal' },
    y: { field: 'value', type: 'quantitative', stack: true },
    color: { field: 'group', type: 'nominal' }
  }
};

export const waffleChart: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: Array.from({ length: 100 }, (_, i) => ({
      value: i,
      category: i < 30 ? 'A' : i < 60 ? 'B' : i < 85 ? 'C' : 'D'
    }))
  },
  mark: 'square',
  encoding: {
    x: {
      field: 'value',
      type: 'ordinal',
      axis: null,
      scale: { domain: Array.from({ length: 10 }, (_, i) => i) }
    },
    y: {
      field: 'value',
      type: 'ordinal',
      axis: null,
      scale: { domain: Array.from({ length: 10 }, (_, i) => i) }
    },
    color: { field: 'category', type: 'nominal' }
  }
};

export const partToWhole = {
  'pie-chart': pieChart,
  'donut-chart': donutChart,
  'stacked-bar': stackedBar,
  'waffle-chart': waffleChart
}; 