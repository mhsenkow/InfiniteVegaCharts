import { ExtendedSpec, MarkType } from '../types/vega';
import { EncodingField, TooltipEncoding } from '../types/chart';

/**
 * Helper function to transform recommendation encodings into a Vega-Lite compatible format
 * @param recommendedEncodings Encoding channels from recommendations
 * @returns Properly formatted encodings for a Vega-Lite spec
 */
export function transformEncodings(
  recommendedEncodings: Record<string, EncodingField | TooltipEncoding>
): Record<string, any> {
  return Object.entries(recommendedEncodings).reduce<Record<string, any>>((acc, [channel, config]) => {
    // Handle tooltip arrays
    if (channel === 'tooltip' && Array.isArray(config)) {
      // Convert array to proper Vega-Lite format
      acc[channel] = { 
        field: config.map(item => item.field).join(','),
        type: config[0].type
      };
      return acc;
    }
    
    // Normal field configuration
    if (config && typeof config === 'object' && 'field' in config) {
      acc[channel] = {
        field: config.field,
        type: config.type,
        ...(config.aggregate && { aggregate: config.aggregate }),
        ...(config.scale && { scale: config.scale }),
        ...(config.sort && { sort: config.sort }),
        ...(config.bin && { bin: config.bin }),
        // Only add optional properties if they exist
        ...(('timeUnit' in config) && { timeUnit: config.timeUnit }),
        ...(('format' in config) && { format: config.format }),
        ...(('stack' in config) && { stack: config.stack }),
        ...(('title' in config) && { title: config.title })
      };
    }
    return acc;
  }, {});
}

/**
 * Helper function to create a proper mark configuration
 * @param markType Chart type to create
 * @param options Additional mark options
 * @returns Proper mark configuration for Vega-Lite
 */
export function createMarkConfig(
  markType: MarkType, 
  options: Record<string, any> = {}
): ExtendedSpec['mark'] {
  if (Object.keys(options).length === 0) {
    return markType; // Return simple string format if no options
  }
  
  // Start with the required type
  const markConfig = {
    type: markType,
    ...options
  };
  
  // Add mark-specific default configurations
  switch (markType) {
    case 'bar':
      return {
        ...markConfig,
        tooltip: true,
        ...(options.cornerRadius !== undefined ? {} : { cornerRadius: 0 })
      };
    case 'line':
      return {
        ...markConfig,
        point: options.point !== false,
        tooltip: true,
        ...(options.strokeWidth !== undefined ? {} : { strokeWidth: 2 })
      };
    case 'area':
      return {
        ...markConfig,
        tooltip: true,
        ...(options.opacity !== undefined ? {} : { opacity: 0.7 }),
        line: options.line !== false
      };
    case 'point':
    case 'circle':
      return {
        ...markConfig,
        tooltip: true,
        ...(options.size !== undefined ? {} : { size: 60 }),
        filled: options.filled !== false
      };
    default:
      return {
        ...markConfig,
        tooltip: true
      };
  }
}

/**
 * Updates a Vega-Lite spec with new configurations
 * @param spec Original spec to update
 * @param updates New values to apply
 * @returns Updated spec
 */
export function updateSpec(
  spec: ExtendedSpec,
  updates: Partial<ExtendedSpec>
): ExtendedSpec {
  const result = { ...spec };
  
  // Handle mark updates
  if (updates.mark) {
    if (typeof updates.mark === 'string') {
      result.mark = updates.mark;
    } else if (typeof result.mark === 'string') {
      // Convert string mark to object
      result.mark = {
        type: result.mark as MarkType,
        ...updates.mark
      };
    } else {
      // Merge object marks
      result.mark = {
        ...result.mark,
        ...updates.mark
      };
    }
  }
  
  // Handle encoding updates
  if (updates.encoding) {
    result.encoding = {
      ...result.encoding,
      ...updates.encoding
    };
  }
  
  // Handle config updates with special merge for nested properties
  if (updates.config) {
    result.config = {
      ...result.config,
      ...updates.config,
      // Special handling for nested config objects
      ...(updates.config.axis && result.config?.axis ? {
        axis: { ...result.config.axis, ...updates.config.axis }
      } : {}),
      ...(updates.config.legend && result.config?.legend ? {
        legend: { ...result.config.legend, ...updates.config.legend }
      } : {}),
      ...(updates.config.view && result.config?.view ? {
        view: { ...result.config.view, ...updates.config.view }
      } : {}),
      ...(updates.config.mark && result.config?.mark ? {
        mark: { ...result.config.mark, ...updates.config.mark }
      } : {})
    };
  }
  
  // Handle data updates
  if (updates.data) {
    result.data = {
      ...result.data,
      ...updates.data
    };
  }
  
  // Add a render key if needed
  if (updates.config?._renderKey) {
    result.config = {
      ...result.config,
      _renderKey: updates.config._renderKey
    };
  }
  
  return result;
}

/**
 * Creates a complete spec from a recommendation
 * @param recommendation Chart recommendation 
 * @param data Dataset values
 * @returns Complete Vega-Lite spec
 */
export function createSpecFromRecommendation(
  recommendation: { 
    chartType: string; 
    suggestedEncodings: Record<string, any>;
  },
  data: any[]
): ExtendedSpec {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: data },
    mark: createMarkConfig(recommendation.chartType as MarkType),
    encoding: transformEncodings(recommendation.suggestedEncodings),
    config: {
      view: { stroke: null },
      axis: { grid: true, tickBand: 'extent' }
    }
  };
} 