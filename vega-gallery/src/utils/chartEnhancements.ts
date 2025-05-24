import { ExtendedSpec, MarkType } from '../types/vega';
import { createDataSample } from './dataUtils';

// Define our own interface for inline data to avoid import issues
interface InlineData {
  values: any[];
  [key: string]: any;
}

/**
 * Maximum number of data points to include in a chart for optimal performance
 * Different chart types can handle different amounts of data efficiently
 */
const MAX_CHART_DATA_POINTS: Record<string, number> = {
  // Default limit for most chart types
  default: 5000,
  
  // Specialized limits for different chart types
  line: 10000,
  area: 5000,
  bar: 2000,
  point: 5000,
  circle: 5000,
  text: 1000,
  arc: 200,
  pie: 200,
  boxplot: 2000,
  violin: 2000,
  heatmap: 20000,
  rect: 10000,
  rule: 2000,
  tick: 5000,
  trail: 5000,
  image: 1000,
  parallel: 2000,
  map: 5000,
  wordcloud: 500
};

/**
 * Enhances a chart specification with additional configuration and optimizations
 * @param spec The Vega-Lite specification to enhance
 * @param chartType The type of chart being rendered
 * @param overrideSampleSize Optional manual override for sample size
 * @returns Enhanced specification
 */
export const enhanceChartSpec = (
  spec: ExtendedSpec, 
  chartType: MarkType,
  overrideSampleSize?: number
): ExtendedSpec => {
  let enhancedSpec = { ...spec };
  
  // Apply optimizations for large datasets
  enhancedSpec = optimizeDataForChart(enhancedSpec, chartType, overrideSampleSize);
  
  // Add any additional enhancements here...
  
  return enhancedSpec;
};

/**
 * Optimizes the dataset for a chart by sampling if necessary
 * @param spec The chart specification
 * @param chartType The type of chart
 * @param overrideSampleSize Optional manual override for sample size
 * @returns Optimized specification with sampled data if needed
 */
const optimizeDataForChart = (
  spec: ExtendedSpec, 
  chartType: MarkType,
  overrideSampleSize?: number
): ExtendedSpec => {
  // If there's no data, return the spec unchanged
  if (!spec.data) {
    return spec;
  }
  
  // Check if we have inline data
  const inlineData = spec.data as InlineData;
  if (!inlineData.values || !Array.isArray(inlineData.values)) {
    return spec;
  }
  
  const data = inlineData.values;
  
  // If overrideSampleSize is provided, use that directly
  if (overrideSampleSize && overrideSampleSize > 0) {
    // Only sample if the dataset is larger than the requested sample size
    if (data.length > overrideSampleSize) {
      console.log(`Using user-specified sample size: ${overrideSampleSize} points`);
      
      // Sample the dataset
      const sampledData = createDataSample(data, overrideSampleSize);
      
      // Return a new spec with the sampled data
      return {
        ...spec,
        data: {
          ...inlineData,
          values: sampledData
        }
      };
    }
    return spec;
  }
  
  // Otherwise, use the chart-type-specific limit
  const limit = MAX_CHART_DATA_POINTS[chartType] || MAX_CHART_DATA_POINTS['default'];
  
  // If the dataset is small enough, return the spec unchanged
  if (data.length <= limit) {
    return spec;
  }
  
  console.log(`Sampling dataset from ${data.length} to ${limit} points for ${chartType} chart`);
  
  // Sample the dataset
  const sampledData = createDataSample(data, limit);
  
  // Return a new spec with the sampled data
  return {
    ...spec,
    data: {
      ...inlineData,
      values: sampledData
    }
  };
}; 