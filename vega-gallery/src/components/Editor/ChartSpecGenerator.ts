import { TopLevelSpec } from 'vega-lite';
import { ChartEncoding, MarkType } from '../../types/vega';
import { createParallelCoordinatesSpec } from '../../utils/chartAdapters';

/**
 * Generates a chart specification based on the mark type, encoding, and data.
 * 
 * Special handling is applied for:
 * 1. Parallel coordinates charts:
 *    - Uses createParallelCoordinatesSpec which properly configures the fold transform
 *    - Ensures the mark type is set to 'line' with filled: false to prevent rendering errors
 * 
 * 2. Word cloud charts:
 *    - Uses text mark type with specific alignment settings
 */
export const generateChartSpec = (
  markType: MarkType,
  encoding: ChartEncoding,
  data: any[]
): TopLevelSpec => {
  // Special handling for parallel coordinates
  if (markType === 'parallel-coordinates') {
    if (!data || data.length === 0) {
      // Return a default chart with sample data if no data is provided
      return {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 500,
        height: 300,
        data: {
          values: Array.from({ length: 10 }, (_, i) => ({
            id: i,
            dim1: Math.random() * 100,
            dim2: Math.random() * 100,
            dim3: Math.random() * 100
          }))
        },
        transform: [{ fold: ['dim1', 'dim2', 'dim3'] }],
        mark: { 
          type: 'line',  // Use standard line mark type
          opacity: 0.5,
          filled: false  // Critical to avoid rendering errors
        },
        encoding: {
          x: { field: 'key', type: 'nominal' },
          y: { field: 'value', type: 'quantitative', scale: { zero: false } },
          color: { field: 'id', type: 'nominal' },
          detail: { field: 'id', type: 'nominal' }
        },
        resolve: { scale: { y: 'independent' } }
      } as any;
    }
    
    // Extract numeric dimensions
    const dimensions = Object.keys(data[0] || {}).filter(field => 
      typeof data[0][field] === 'number'
    );

    // Ensure we have at least 3 dimensions, even if they're not all numeric
    const allDimensions = Object.keys(data[0] || {});
    const actualDimensions = dimensions.length >= 3 ? dimensions : 
      dimensions.concat(allDimensions.filter(d => !dimensions.includes(d)).slice(0, 3 - dimensions.length));
    
    // Extract field names from encoding
    const detailField = typeof encoding.detail === 'object' ? (encoding.detail as any).field : 
      allDimensions.find(d => d.toLowerCase().includes('id')) || 
      allDimensions[0];
    
    const colorField = typeof encoding.color === 'object' ? (encoding.color as any).field : undefined;
    const opacityField = typeof encoding.opacity === 'object' ? (encoding.opacity as any).field : undefined;
    
    const parallelCoordinatesSpec = createParallelCoordinatesSpec(
      data,
      actualDimensions,
      detailField,
      colorField,
      opacityField
    );
    
    // Use as any to bypass type checking issues
    const result = parallelCoordinatesSpec as any;
    
    // Ensure the mark is properly set to avoid rendering errors
    if (typeof result.mark === 'object') {
      result.mark.type = 'line';
      result.mark.filled = false;
    } else {
      result.mark = { 
        type: 'line', 
        opacity: 0.5,
        filled: false 
      };
    }
    
    return result;
  }

  // Special handling for word cloud
  if (markType === 'wordcloud') {
    // Ensure we have text and value fields
    let textField = 'text';
    let valueField = 'value';
    
    if (data && data.length > 0) {
      const keys = Object.keys(data[0]);
      // Look for likely text field
      textField = keys.find(k => 
        k.toLowerCase().includes('text') || 
        k.toLowerCase().includes('word') || 
        k.toLowerCase().includes('term')
      ) || keys[0];
      
      // Look for likely value/size field
      valueField = keys.find(k => 
        k.toLowerCase().includes('value') || 
        k.toLowerCase().includes('count') || 
        k.toLowerCase().includes('size') || 
        k.toLowerCase().includes('weight')
      ) || (keys.length > 1 ? keys[1] : keys[0]);
    }
    
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 600,
      height: 400,
      data: { values: data },
      mark: {
        type: 'text',
        baseline: 'middle',
        align: 'center'
      },
      encoding: {
        text: { field: textField },
        size: {
          field: valueField,
          type: 'quantitative',
          scale: { range: [12, 48] }
        },
        color: {
          field: valueField,
          type: 'quantitative',
          scale: { scheme: 'blues' }
        }
      }
    } as any;
  }

  // Default chart spec generation
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: data
    },
    mark: markType,
    encoding
  } as any;
}; 