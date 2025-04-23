import { ChartConfig } from '../types/chart';
import { TopLevelSpec } from 'vega-lite';
import { Spec as VegaSpec } from 'vega';
import { ChartCategory, Complexity } from '../types/chart';

// Statistical Charts
export const statistical = {
  'scatter-plot': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 20 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100
      }))
    },
    mark: 'point',
    encoding: {
      x: { field: 'x', type: 'quantitative' },
      y: { field: 'y', type: 'quantitative' }
    }
  } as TopLevelSpec,
  'bar-chart': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: [
        { category: 'A', value: 28 },
        { category: 'B', value: 55 },
        { category: 'C', value: 43 }
      ]
    },
    mark: 'bar',
    encoding: {
      x: { field: 'category', type: 'nominal' },
      y: { field: 'value', type: 'quantitative' }
    }
  } as TopLevelSpec,
  'boxplot-distribution': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 100 }, () => ({
        category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        value: Math.random() * 100
      }))
    },
    mark: 'boxplot',
    encoding: {
      x: { field: 'category', type: 'nominal' },
      y: { field: 'value', type: 'quantitative' }
    }
  } as TopLevelSpec,
  'heatmap-correlation': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 9 }, (_, i) => 
        Array.from({ length: 9 }, (_, j) => ({
          x: i,
          y: j,
          value: Math.random()
        }))
      ).flat()
    },
    mark: 'rect',
    encoding: {
      x: { field: 'x', type: 'ordinal' },
      y: { field: 'y', type: 'ordinal' },
      color: { field: 'value', type: 'quantitative' }
    }
  } as TopLevelSpec
};

// Time Series Charts
export const timeSeries = {
  'line-chart': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 20 }, (_, i) => ({
        time: i,
        value: Math.sin(i / 3) * 50 + 50
      }))
    },
    mark: 'line',
    encoding: {
      x: { field: 'time', type: 'quantitative' },
      y: { field: 'value', type: 'quantitative' }
    }
  } as TopLevelSpec,
  'area-growth': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 20 }, (_, i) => ({
        time: i,
        value: Math.pow(1.1, i) * 10
      }))
    },
    mark: 'area',
    encoding: {
      x: { field: 'time', type: 'quantitative' },
      y: { field: 'value', type: 'quantitative' }
    }
  } as TopLevelSpec,
  'stream-graph': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 60 }, (_, i) => 
        ['A', 'B', 'C'].map(category => ({
          time: i,
          value: Math.sin(i / 10 + ['A', 'B', 'C'].indexOf(category)) * 10 + 20,
          category: category
        }))
      ).flat()
    },
    mark: {
      type: 'area',
      interpolate: 'monotone'
    },
    encoding: {
      x: { field: 'time', type: 'quantitative' },
      y: { field: 'value', type: 'quantitative', stack: 'center' },
      color: { field: 'category', type: 'nominal' }
    }
  } as TopLevelSpec,
  'radial-plot': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        value: 20 + Math.sin(i / 24 * Math.PI * 2) * 10 + Math.random() * 5
      }))
    },
    encoding: {
      theta: { field: 'hour', type: 'quantitative', scale: { domain: [0, 24] } },
      radius: { field: 'value', type: 'quantitative' }
    },
    mark: 'line',
    width: 300,
    height: 300
  } as TopLevelSpec,
  'interactive-multiline': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 60 }, (_, i) => 
        ['A', 'B', 'C'].map(series => ({
          time: i,
          value: Math.sin(i / 10 + ['A', 'B', 'C'].indexOf(series) * 2) * 10 + 20,
          series: series
        }))
      ).flat()
    },
    mark: { type: 'line', point: true },
    encoding: {
      x: { field: 'time', type: 'quantitative' },
      y: { field: 'value', type: 'quantitative' },
      color: { field: 'series', type: 'nominal' }
    },
    selection: {
      highlight: { type: 'single', on: 'mouseover', nearest: true }
    }
  } as TopLevelSpec
};

// Comparison Charts
export const comparison = {
  'grouped-bar': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: [
        { category: 'A', group: 'Group 1', value: 28 },
        { category: 'B', group: 'Group 1', value: 55 },
        { category: 'C', group: 'Group 1', value: 43 },
        { category: 'A', group: 'Group 2', value: 19 },
        { category: 'B', group: 'Group 2', value: 44 },
        { category: 'C', group: 'Group 2', value: 35 }
      ]
    },
    mark: 'bar',
    encoding: {
      x: { field: 'category', type: 'nominal' },
      y: { field: 'value', type: 'quantitative' },
      xOffset: { field: 'group' },
      color: { field: 'group', type: 'nominal' }
    }
  } as TopLevelSpec,
  'violin-plot': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 100 }, () => ({
        category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        value: Math.random() * 100
      }))
    },
    mark: 'violin',
    encoding: {
      x: { field: 'category', type: 'nominal' },
      y: { field: 'value', type: 'quantitative' }
    }
  } as TopLevelSpec,
  'heatmap': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 9 }, (_, i) => 
        Array.from({ length: 9 }, (_, j) => ({
          x: i,
          y: j,
          value: Math.random()
        }))
      ).flat()
    },
    mark: 'rect',
    encoding: {
      x: { field: 'x', type: 'ordinal' },
      y: { field: 'y', type: 'ordinal' },
      color: { field: 'value', type: 'quantitative' }
    }
  } as TopLevelSpec,
  'parallel-coordinates': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 20 }, (_, i) => ({
        id: i,
        dim1: Math.random() * 100,
        dim2: Math.random() * 100,
        dim3: Math.random() * 100,
        category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
      }))
    },
    transform: [
      { fold: ['dim1', 'dim2', 'dim3'] }
    ],
    mark: { type: 'line', opacity: 0.5 },
    encoding: {
      x: { field: 'key', type: 'nominal' },
      y: { field: 'value', type: 'quantitative', scale: { zero: false } },
      color: { field: 'category', type: 'nominal' },
      detail: { field: 'id', type: 'nominal' }
    }
  } as TopLevelSpec,
  'stacked-bar': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 20 }, (_, i) => 
        ['A', 'B', 'C'].map(category => ({
          x: `Day ${i % 5 + 1}`,
          value: Math.random() * 30 + 10,
          category: category
        }))
      ).flat()
    },
    mark: 'bar',
    encoding: {
      x: { field: 'x', type: 'ordinal' },
      y: { field: 'value', type: 'quantitative', stack: 'zero' },
      color: { field: 'category', type: 'nominal' }
    }
  } as TopLevelSpec,
  'stacked-area': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 60 }, (_, i) => 
        ['A', 'B', 'C'].map(category => ({
          time: i,
          value: Math.sin(i / 10 + ['A', 'B', 'C'].indexOf(category)) * 10 + 20,
          category: category
        }))
      ).flat()
    },
    mark: { type: 'area', interpolate: 'monotone' },
    encoding: {
      x: { field: 'time', type: 'quantitative' },
      y: { field: 'value', type: 'quantitative', stack: 'zero' },
      color: { field: 'category', type: 'nominal' }
    }
  } as TopLevelSpec,
  'normalized-bar': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 20 }, (_, i) => 
        ['A', 'B', 'C'].map(category => ({
          x: `Category ${i % 5 + 1}`,
          value: Math.random() * 30 + 10,
          category: category
        }))
      ).flat()
    },
    mark: 'bar',
    encoding: {
      x: { field: 'x', type: 'ordinal' },
      y: { field: 'value', type: 'quantitative', stack: 'normalize' },
      color: { field: 'category', type: 'nominal' }
    }
  } as TopLevelSpec
};

// Correlation Charts
export const correlation = {
  'bubble-plot': {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: Array.from({ length: 20 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 50 + 10,
        category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
      }))
    },
    mark: {
      type: 'circle',
      opacity: 0.7
    },
    encoding: {
      x: { field: 'x', type: 'quantitative' },
      y: { field: 'y', type: 'quantitative' },
      size: { field: 'size', type: 'quantitative' },
      color: { field: 'category', type: 'nominal' }
    }
  } as TopLevelSpec
};

// Part to Whole Charts
export const partToWhole = {
  'pie-chart': {
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
      theta: { field: 'value', type: 'quantitative', stack: true },
      color: { field: 'category', type: 'nominal' }
    }
  } as TopLevelSpec,
  'waffle-chart': {
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
        scale: { domain: Array.from({ length: 10 }, (_, i) => i) }
      },
      y: {
        field: 'value',
        type: 'ordinal',
        scale: { domain: Array.from({ length: 10 }, (_, i) => i) }
      },
      color: { field: 'category', type: 'nominal' }
    }
  } as TopLevelSpec
};

// Hierarchical Charts
export const hierarchical = {
  'treemap': {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    padding: 5,
    data: [
      {
        name: 'tree',
        values: [
          {"id": 1, "name": "Root", "parent": null, "size": 100},
          {"id": 2, "name": "A", "parent": 1, "size": 50},
          {"id": 3, "name": "B", "parent": 1, "size": 30},
          {"id": 4, "name": "C", "parent": 1, "size": 20},
          {"id": 5, "name": "A1", "parent": 2, "size": 20},
          {"id": 6, "name": "A2", "parent": 2, "size": 30},
          {"id": 7, "name": "B1", "parent": 3, "size": 15},
          {"id": 8, "name": "B2", "parent": 3, "size": 15},
          {"id": 9, "name": "C1", "parent": 4, "size": 20}
        ],
        transform: [
          { type: "stratify", key: "id", parentKey: "parent" },
          { type: "treemap", field: "size", sort: { field: "value", order: "descending" } }
        ]
      }
    ],
    marks: [
      {
        type: "rect",
        from: { data: "tree" },
        encode: {
          enter: {
            x: { field: "x0" },
            y: { field: "y0" },
            x2: { field: "x1" },
            y2: { field: "y1" },
            fill: { scale: "color", field: "name" },
            stroke: { value: "white" }
          }
        }
      }
    ],
    scales: [
      {
        name: "color",
        type: "ordinal",
        range: { scheme: "category10" }
      }
    ]
  } as VegaSpec,
  'sunburst': {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    padding: 5,
    data: [
      {
        name: "tree",
        values: [
          {"id": 1, "name": "Root", "parent": null, "size": 100},
          {"id": 2, "name": "A", "parent": 1, "size": 50},
          {"id": 3, "name": "B", "parent": 1, "size": 30},
          {"id": 4, "name": "C", "parent": 1, "size": 20},
          {"id": 5, "name": "A1", "parent": 2, "size": 20},
          {"id": 6, "name": "A2", "parent": 2, "size": 30},
          {"id": 7, "name": "B1", "parent": 3, "size": 15},
          {"id": 8, "name": "B2", "parent": 3, "size": 15},
          {"id": 9, "name": "C1", "parent": 4, "size": 20}
        ],
        transform: [
          { type: "stratify", key: "id", parentKey: "parent" },
          { 
            type: "partition", 
            field: "size", 
            sort: { field: "value", order: "descending" },
            size: [{ signal: "width" }, { signal: "height" }],
            round: true
          }
        ]
      }
    ],
    scales: [
      {
        name: "color",
        type: "ordinal",
        range: { scheme: "category10" }
      }
    ],
    marks: [
      {
        type: "arc",
        from: { data: "tree" },
        encode: {
          enter: {
            x: { signal: "width / 2" },
            y: { signal: "height / 2" },
            fill: { scale: "color", field: "name" },
            stroke: { value: "white" }
          },
          update: {
            startAngle: { field: "x0" },
            endAngle: { field: "x1" },
            innerRadius: { field: "y0" },
            outerRadius: { field: "y1" }
          }
        }
      }
    ]
  } as VegaSpec
};

// Text Analysis Charts
export const textAnalysis = {
  'word-cloud': {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    data: [
      {
        name: "words",
        values: [
          {"text": "data", "value": 65},
          {"text": "visualization", "value": 60},
          {"text": "chart", "value": 55},
          {"text": "graph", "value": 50},
          {"text": "analytics", "value": 45},
          {"text": "interactive", "value": 40},
          {"text": "dashboard", "value": 35},
          {"text": "Vega", "value": 30},
          {"text": "Lite", "value": 25},
          {"text": "gallery", "value": 20},
          {"text": "analysis", "value": 18},
          {"text": "explore", "value": 15},
          {"text": "insight", "value": 12},
          {"text": "trend", "value": 10}
        ]
      }
    ],
    marks: [
      {
        type: "text",
        from: { data: "words" },
        encode: {
          enter: {
            text: { field: "text" },
            fontSize: { scale: "size", field: "value" },
            fill: { scale: "color", field: "value" },
            xc: { signal: "width / 2" },
            yc: { signal: "height / 2" },
            align: { value: "center" },
            baseline: { value: "middle" }
          }
        },
        transform: [
          {
            type: "wordcloud",
            size: [800, 400],
            text: { field: "text" },
            fontSize: { field: "value", scale: "sqrt" },
            padding: 2
          }
        ]
      }
    ],
    scales: [
      {
        name: "size",
        type: "linear",
        domain: { data: "words", field: "value" },
        range: [10, 56]
      },
      {
        name: "color",
        type: "linear",
        domain: { data: "words", field: "value" },
        range: { scheme: "blues" }
      }
    ]
  } as VegaSpec
};

// Export all chart specifications
export const chartSpecs = {
  ...statistical,
  ...timeSeries,
  ...comparison,
  ...correlation,
  ...partToWhole,
  ...hierarchical,
  ...textAnalysis
};

// Sample charts configuration
export const sampleCharts: ChartConfig[] = [
  {
    id: 'scatter-plot',
    title: 'Scatter Plot',
    description: 'A basic scatter plot showing the relationship between two variables',
    category: ChartCategory.Statistical,
    complexity: Complexity.Beginner,
    spec: statistical['scatter-plot'],
    metadata: {
      tags: ['correlation', 'distribution', 'points'],
      dataRequirements: {
        requiredFields: ['x', 'y']
      }
    }
  },
  {
    id: 'bar-chart',
    title: 'Bar Chart',
    description: 'Simple bar chart for comparing categorical data',
    category: ChartCategory.Statistical,
    complexity: Complexity.Beginner,
    spec: statistical['bar-chart']
  },
  {
    id: 'line-chart',
    title: 'Line Chart',
    description: 'Time series visualization showing trends over time',
    category: ChartCategory.TimeSeries,
    complexity: Complexity.Beginner,
    spec: timeSeries['line-chart']
  },
  {
    id: 'area-growth',
    title: 'Area Chart',
    description: 'Area chart showing cumulative growth',
    category: ChartCategory.TimeSeries,
    complexity: Complexity.Intermediate,
    spec: timeSeries['area-growth']
  },
  {
    id: 'pie-chart',
    title: 'Pie Chart',
    description: 'Circular statistical visualization for part-to-whole relationships',
    category: ChartCategory.PartToWhole,
    complexity: Complexity.Intermediate,
    spec: partToWhole['pie-chart']
  },
  {
    id: 'treemap',
    title: 'Treemap',
    description: 'Hierarchical data visualization using nested rectangles',
    category: ChartCategory.Hierarchical,
    complexity: Complexity.Intermediate,
    spec: hierarchical['treemap'],
    metadata: {
      useCase: ['Data Analysis', 'Business Reporting'],
      dataTypes: ['numerical', 'categorical'],
      keywords: ['hierarchy', 'nesting', 'proportions']
    }
  },
  {
    id: 'sunburst',
    title: 'Sunburst Chart',
    description: 'Radial visualization of hierarchical data',
    category: ChartCategory.Hierarchical,
    complexity: Complexity.Advanced,
    spec: hierarchical['sunburst']
  },
  {
    id: 'bubble-plot',
    title: 'Bubble Plot',
    description: 'Scatter plot with sized circles for multivariate data',
    category: ChartCategory.Correlation,
    complexity: Complexity.Intermediate,
    spec: correlation['bubble-plot']
  },
  {
    id: 'word-cloud',
    title: 'Word Cloud',
    description: 'Text visualization with size encoding for frequency',
    category: ChartCategory.TextAnalysis,
    complexity: Complexity.Intermediate,
    spec: textAnalysis['word-cloud']
  },
  {
    id: 'boxplot-distribution',
    title: 'Box Plot',
    description: 'Statistical distribution across categories',
    category: ChartCategory.Statistical,
    complexity: Complexity.Intermediate,
    spec: statistical['boxplot-distribution']
  },
  {
    id: 'heatmap-correlation',
    title: 'Correlation Heatmap',
    description: 'Interactive heatmap showing correlation between variables',
    category: ChartCategory.Statistical,
    complexity: Complexity.Intermediate,
    spec: statistical['heatmap-correlation']
  },
  {
    id: 'stream-graph',
    title: 'Stream Graph',
    description: 'Flowing visualization of temporal patterns',
    category: ChartCategory.TimeSeries,
    complexity: Complexity.Advanced,
    spec: timeSeries['stream-graph']
  },
  {
    id: 'radial-plot',
    title: 'Radial Plot',
    description: 'Circular visualization of periodic patterns',
    category: ChartCategory.TimeSeries,
    complexity: Complexity.Advanced,
    spec: timeSeries['radial-plot']
  },
  {
    id: 'interactive-multiline',
    title: 'Interactive Multi-Line',
    description: 'Interactive time series with multiple series',
    category: ChartCategory.TimeSeries,
    complexity: Complexity.Advanced,
    spec: timeSeries['interactive-multiline']
  },
  {
    id: 'violin-plot',
    title: 'Violin Plot',
    description: 'Distribution visualization showing density across categories',
    category: ChartCategory.Comparison,
    complexity: Complexity.Intermediate,
    spec: comparison['violin-plot'],
    metadata: {
      tags: ['distribution', 'density', 'categories'],
      dataRequirements: {
        requiredFields: ['category', 'value', 'group']
      }
    }
  },
  {
    id: 'heatmap',
    title: 'Correlation Heatmap',
    description: 'Interactive heatmap showing correlation between variables',
    category: ChartCategory.Comparison,
    complexity: Complexity.Intermediate,
    spec: comparison['heatmap'],
    metadata: {
      tags: ['correlation', 'matrix', 'intensity'],
      dataRequirements: {
        requiredFields: ['x', 'y', 'value']
      }
    }
  },
  {
    id: 'parallel-coordinates',
    title: 'Parallel Coordinates',
    description: 'Multi-dimensional data visualization for comparing variables',
    category: ChartCategory.Comparison,
    complexity: Complexity.Advanced,
    spec: comparison['parallel-coordinates'],
    metadata: {
      tags: ['multi-dimensional', 'comparison', 'lines'],
      dataRequirements: {
        requiredFields: ['id', 'dim1', 'dim2', 'dim3', 'category']
      }
    }
  },
  {
    id: 'stacked-bar',
    title: 'Stacked Bar',
    description: 'Bar chart with stacked values showing part-to-whole relationships',
    category: ChartCategory.Comparison,
    complexity: Complexity.Intermediate,
    spec: comparison['stacked-bar'],
    metadata: {
      tags: ['stacked', 'bar', 'comparison'],
      dataRequirements: {
        requiredFields: ['x', 'value', 'category']
      }
    }
  },
  {
    id: 'stacked-area',
    title: 'Stacked Area',
    description: 'Area chart with stacked values showing temporal patterns',
    category: ChartCategory.TimeSeries,
    complexity: Complexity.Intermediate,
    spec: comparison['stacked-area'],
    metadata: {
      tags: ['stacked', 'area', 'time series'],
      dataRequirements: {
        requiredFields: ['time', 'value', 'category']
      }
    }
  },
  {
    id: 'normalized-bar',
    title: '100% Stacked Bar',
    description: 'Bar chart showing proportional relationships as percentages',
    category: ChartCategory.PartToWhole,
    complexity: Complexity.Intermediate,
    spec: comparison['normalized-bar'],
    metadata: {
      tags: ['normalized', 'percentage', 'proportional'],
      dataRequirements: {
        requiredFields: ['x', 'value', 'category']
      }
    }
  }
]; 