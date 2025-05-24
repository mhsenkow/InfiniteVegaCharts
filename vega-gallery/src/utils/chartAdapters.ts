import { MarkType, EncodingField, EncodingChannel } from '../types/vega';
import { DatasetMetadata } from '../types/dataset';
import { detectDataTypes } from './dataUtils';
import { TopLevelSpec } from 'vega-lite';

interface EncodingConfig {
  x?: { field: string; type: string };
  y?: { field: string; type: string };
  color?: { field: string; type: string };
  size?: { field: string; type: string };
  theta?: { field: string; type: string };
  radius?: { field: string; type: string };
  text?: { field: string; type: string };
}

interface EncodingOption {
  field: string;
  type: string;
  description?: string;
}

interface EncodingOptions {
  x: EncodingOption[];
  y: EncodingOption[];
  color: EncodingOption[];
  size: EncodingOption[];
  theta: EncodingOption[];
  radius: EncodingOption[];
  text: EncodingOption[];
}

export const determineChartEncodings = (
  chartType: MarkType,
  dataset: DatasetMetadata
): EncodingConfig => {
  const dataTypes = detectDataTypes(dataset.values);
  const fields = Object.entries(dataTypes);
  
  // Find fields by type
  const quantitativeFields = fields.filter(([_, type]) => type === 'quantitative').map(([field]) => field);
  const temporalFields = fields.filter(([_, type]) => type === 'temporal').map(([field]) => field);
  const categoricalFields = fields.filter(([_, type]) => ['nominal', 'ordinal'].includes(type)).map(([field]) => field);
  
  switch (chartType) {
    case 'bar':
      return {
        x: categoricalFields.length ? 
          { field: categoricalFields[0], type: 'nominal' } :
          { field: temporalFields[0], type: 'temporal' },
        y: { field: quantitativeFields[0], type: 'quantitative' },
        color: categoricalFields.length > 1 ? 
          { field: categoricalFields[1], type: 'nominal' } : undefined
      };

    case 'line':
      return {
        x: temporalFields.length ? 
          { field: temporalFields[0], type: 'temporal' } :
          { field: quantitativeFields[0], type: 'quantitative' },
        y: { field: quantitativeFields[temporalFields.length ? 0 : 1], type: 'quantitative' },
        color: categoricalFields.length ? 
          { field: categoricalFields[0], type: 'nominal' } : undefined
      };

    case 'point':
      return {
        x: quantitativeFields[0] ? 
          { field: quantitativeFields[0], type: 'quantitative' } :
          { field: categoricalFields[0], type: 'nominal' },
        y: quantitativeFields[1] ? 
          { field: quantitativeFields[1], type: 'quantitative' } :
          { field: quantitativeFields[0], type: 'quantitative' },
        size: quantitativeFields[2] ? 
          { field: quantitativeFields[2], type: 'quantitative' } : undefined,
        color: categoricalFields.length ? 
          { field: categoricalFields[0], type: 'nominal' } : undefined
      };

    case 'arc':
      return {
        theta: { field: quantitativeFields[0], type: 'quantitative' },
        color: { field: categoricalFields[0], type: 'nominal' }
      };

    case 'boxplot':
      return {
        x: { field: categoricalFields[0], type: 'nominal' },
        y: { field: quantitativeFields[0], type: 'quantitative' },
        color: categoricalFields.length > 1 ? 
          { field: categoricalFields[1], type: 'nominal' } : undefined
      };
      
    case 'violin':
      return {
        x: { field: categoricalFields[0], type: 'nominal' },
        y: { field: quantitativeFields[0], type: 'quantitative' },
        color: categoricalFields.length > 1 ? 
          { field: categoricalFields[1], type: 'nominal' } : undefined
      };

    case 'area':
      return {
        x: temporalFields.length ? 
          { field: temporalFields[0], type: 'temporal' } :
          { field: quantitativeFields[0], type: 'quantitative' },
        y: { field: quantitativeFields[temporalFields.length ? 0 : 1], type: 'quantitative' },
        color: categoricalFields.length ? 
          { field: categoricalFields[0], type: 'nominal' } : undefined
      };

    case 'text':
      return {
        x: quantitativeFields[0] ? 
          { field: quantitativeFields[0], type: 'quantitative' } :
          { field: categoricalFields[0], type: 'nominal' },
        y: quantitativeFields[1] ? 
          { field: quantitativeFields[1], type: 'quantitative' } :
          { field: categoricalFields[1] || categoricalFields[0], type: 'nominal' },
        text: { field: fields.find(([key]) => key.includes('text') || key.includes('label'))?.[0] || categoricalFields[0], type: 'nominal' }
      };

    case 'wordcloud':
      return {
        text: { field: fields.find(([key]) => key.includes('text') || key.includes('word'))?.[0] || categoricalFields[0], type: 'nominal' },
        size: { field: fields.find(([key]) => key.includes('size') || key.includes('value'))?.[0] || quantitativeFields[0], type: 'quantitative' }
      };

    case 'treemap':
      return {
        size: quantitativeFields[0] ? 
          { field: quantitativeFields[0], type: 'quantitative' } : undefined,
        color: categoricalFields.length ? 
          { field: categoricalFields[0], type: 'nominal' } : undefined
      };

    default:
      return {};
  }
};

export const getCompatibleEncodings = (
  chartType: MarkType,
  dataset: DatasetMetadata
): EncodingOptions => {
  const dataTypes = detectDataTypes(dataset.values);
  const fields = Object.entries(dataTypes);
  
  // Group fields by type with descriptions
  const quantitativeFields = fields
    .filter(([_, type]) => type === 'quantitative')
    .map(([field]) => ({
      field,
      type: 'quantitative',
      description: `Numeric values for ${field}`
    }));

  const temporalFields = fields
    .filter(([_, type]) => type === 'temporal')
    .map(([field]) => ({
      field,
      type: 'temporal',
      description: `Time series data for ${field}`
    }));

  const categoricalFields = fields
    .filter(([_, type]) => ['nominal', 'ordinal'].includes(type))
    .map(([field]) => ({
      field,
      type: 'nominal',
      description: `Categories in ${field}`
    }));

  // Define compatible encodings for each channel based on chart type
  switch (chartType) {
    case 'bar':
      return {
        x: [...categoricalFields, ...temporalFields],
        y: quantitativeFields,
        color: categoricalFields,
        size: [],
        theta: [],
        radius: [],
        text: quantitativeFields
      };

    case 'point':
      return {
        x: [...quantitativeFields, ...temporalFields],
        y: quantitativeFields,
        color: [...categoricalFields, ...quantitativeFields],
        size: quantitativeFields,
        theta: [],
        radius: [],
        text: []
      };

    // Add more chart types...
    
    default:
      return {
        x: [],
        y: [],
        color: [],
        size: [],
        theta: [],
        radius: [],
        text: []
      };
  }
};

const aggregateMethods = ['sum', 'mean', 'median', 'min', 'max'] as const;
const timeUnits = ['year', 'month', 'day', 'hour', 'minute'] as const;
const scaleTypes = ['linear', 'log', 'sqrt', 'pow'] as const;
const stackTypes = ['zero', 'normalize', 'center', null] as const;

// Add these helper functions at the top
const analyzeField = (field: string, values: any[]) => {
  const uniqueValues = new Set(values.map(v => v[field])).size;
  const isNumeric = values.every(v => !isNaN(Number(v[field])));
  const isTemporal = values.some(v => !isNaN(Date.parse(v[field])));
  const uniqueRatio = uniqueValues / values.length;

  return {
    uniqueValues,
    uniqueRatio,
    isNumeric,
    isTemporal,
    cardinality: uniqueValues
  };
};

const getBestEncodingForField = (
  field: string, 
  values: any[], 
  usedEncodings: Set<string>
): { channel: string; encoding: EncodingField } | null => {
  const analysis = analyzeField(field, values);
  
  // Prioritize encodings based on data characteristics
  const possibilities: Array<{
    channel: string;
    score: number;
    encoding: EncodingField;
  }> = [];

  // X-axis possibilities
  if (!usedEncodings.has('x')) {
    if (analysis.isTemporal) {
      possibilities.push({
        channel: 'x',
        score: 0.9,
        encoding: {
          field,
          type: 'temporal',
          scale: {}
        }
      });
    } else if (analysis.isNumeric) {
      possibilities.push({
        channel: 'x',
        score: 0.8,
        encoding: {
          field,
          type: 'quantitative',
          scale: { zero: true }
        }
      });
    }
  }

  // Y-axis possibilities
  if (!usedEncodings.has('y')) {
    if (analysis.isNumeric) {
      possibilities.push({
        channel: 'y',
        score: 0.9,
        encoding: {
          field,
          type: 'quantitative',
          scale: { zero: true }
        }
      });
    }
  }

  // Color encoding for categorical data
  if (!usedEncodings.has('color') && analysis.uniqueRatio < 0.3) {
    possibilities.push({
      channel: 'color',
      score: 0.7,
      encoding: {
        field,
        type: 'nominal'
      }
    });
  }

  // Size encoding for numeric data
  if (!usedEncodings.has('size') && analysis.isNumeric) {
    possibilities.push({
      channel: 'size',
      score: 0.6,
      encoding: {
        field,
        type: 'quantitative',
        scale: { range: [50, 300] }
      }
    });
  }

  // Shape encoding for low-cardinality categorical data
  if (!usedEncodings.has('shape') && analysis.uniqueValues <= 6) {
    possibilities.push({
      channel: 'shape',
      score: 0.5,
      encoding: {
        field,
        type: 'nominal'
      }
    });
  }

  // Sort by score and add some randomness
  possibilities.sort((a, b) => b.score - a.score);
  const randomIndex = Math.floor(Math.random() * Math.min(3, possibilities.length));
  const selected = possibilities[randomIndex];

  return selected ? { channel: selected.channel, encoding: selected.encoding } : null;
};

// Add this mapping of available encodings by mark type
const AVAILABLE_ENCODINGS_BY_MARK = {
  bar: {
    required: ['x', 'y'],
    optional: ['color', 'opacity', 'size', 'tooltip']
  },
  line: {
    required: ['x', 'y'],
    optional: ['color', 'strokeWidth', 'opacity', 'tooltip', 'order']
  },
  point: {
    required: ['x', 'y'],
    optional: ['color', 'size', 'shape', 'opacity', 'tooltip']
  },
  circle: {
    required: ['x', 'y'],
    optional: ['color', 'size', 'opacity', 'tooltip']
  },
  area: {
    required: ['x', 'y'],
    optional: ['color', 'opacity', 'tooltip', 'order']
  },
  text: {
    required: ['text'],
    optional: ['x', 'y', 'color', 'size', 'angle', 'opacity', 'tooltip']
  },
  arc: {
    required: ['theta'],
    optional: ['radius', 'color', 'opacity', 'tooltip', 'x', 'y']
  },
  treemap: {
    required: ['size', 'color'],
    optional: ['tooltip', 'opacity', 'text']
  },
  wordcloud: {
    required: ['text', 'size'],
    optional: ['color', 'angle', 'opacity', 'tooltip']
  },
  'parallel-coordinates': {
    required: ['detail'],
    optional: ['color', 'opacity', 'tooltip']
  },
  boxplot: {
    required: ['x', 'y'],
    optional: ['color', 'opacity', 'tooltip']
  },
  violin: {
    required: ['x', 'y'],
    optional: ['color', 'opacity', 'tooltip', 'size']
  }
} as const;

// Add these constants for encoding transformations
const AGGREGATION_METHODS = ['sum', 'mean', 'median', 'min', 'max', 'count'];
const TIME_UNITS = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute'];
const BIN_OPTIONS = [true, { maxbins: 10 }, { maxbins: 20 }];

export const generateRandomEncoding = (
  chartType: string, 
  availableFields: string[], 
  dataTypes: Record<string, string>
): ChartEncoding => {
  const encoding: ChartEncoding = {};
  const usedFields = new Set<string>();
  
  // Convert fields and types to format needed by helper functions
  const fields: [string, string][] = availableFields
    .filter(field => dataTypes[field])
    .map(field => [field, dataTypes[field]]);
  
  const availableEncodings = AVAILABLE_ENCODINGS_BY_MARK[chartType as keyof typeof AVAILABLE_ENCODINGS_BY_MARK] || {
    required: [],
    optional: ['x', 'y', 'color']
  };

  // Helper to get appropriate fields for encoding type
  const getCompatibleFields = (encodingChannel: string) => {
    // For arc charts, prevent using 'size' encoding
    if (chartType === 'arc' && encodingChannel === 'size') {
      return [];
    }
    
    return fields.filter(field => {
      const type = field[1];
      switch (encodingChannel) {
        case 'x':
        case 'y':
          return type === 'quantitative' || type === 'temporal';
        case 'color':
        case 'shape':
          return type === 'nominal' || type === 'ordinal';
        case 'size':
        case 'strokeWidth':
          return type === 'quantitative';
        case 'theta':
        case 'radius':
          return type === 'quantitative';
        case 'text':
          return true; // Any field can be used as text
        default:
          return true;
      }
    }).filter(field => !usedFields.has(field[0]));
  };

  // First assign required encodings
  for (const channel of availableEncodings.required) {
    const compatibleFields = getCompatibleFields(channel);
    if (compatibleFields.length > 0) {
      const field = compatibleFields[Math.floor(Math.random() * compatibleFields.length)];
      const fieldType = field[1];
      const encodingDef: EncodingField = {
        field: field[0],
        type: getAppropriateType(channel, field[0], fieldType)
      };

      // Add transformations (aggregation, time unit, binning) based on field type
      if (fieldType === 'quantitative') {
        // For quantitative fields, maybe add aggregation or binning
        if (['y', 'theta', 'radius'].includes(channel) && Math.random() > 0.5) {
          // For y-axis and pie chart angles, aggregation is often useful
          encodingDef.aggregate = AGGREGATION_METHODS[Math.floor(Math.random() * AGGREGATION_METHODS.length)];
        } else if (['x'].includes(channel) && Math.random() > 0.7) {
          // For x-axis, binning can be useful
          encodingDef.bin = BIN_OPTIONS[Math.floor(Math.random() * BIN_OPTIONS.length)];
        }
      } else if (fieldType === 'temporal' && Math.random() > 0.5) {
        // For temporal fields, add time unit
        encodingDef.timeUnit = TIME_UNITS[Math.floor(Math.random() * TIME_UNITS.length)];
      }

      encoding[channel] = encodingDef;
      usedFields.add(field[0]);
    }
  }

  // Then randomly assign optional encodings
  const optionalEncodings = [...availableEncodings.optional]
    .sort(() => Math.random() - 0.5)
    .slice(0, 2); // Randomly pick up to 2 optional encodings

  for (const channel of optionalEncodings) {
    const compatibleFields = getCompatibleFields(channel);
    if (compatibleFields.length > 0) {
      const field = compatibleFields[Math.floor(Math.random() * compatibleFields.length)];
      const fieldType = field[1];
      const encodingDef: EncodingField = {
        field: field[0],
        type: getAppropriateType(channel, field[0], fieldType)
      };

      // Add transformations based on field type and channel
      if (fieldType === 'quantitative' && channel === 'color' && Math.random() > 0.5) {
        // For color on quantitative, binning can be useful
        encodingDef.bin = BIN_OPTIONS[Math.floor(Math.random() * BIN_OPTIONS.length)];
      } else if (fieldType === 'temporal' && Math.random() > 0.6) {
        // For temporal fields, add time unit
        encodingDef.timeUnit = TIME_UNITS[Math.floor(Math.random() * TIME_UNITS.length)];
      }

      encoding[channel] = encodingDef;
      usedFields.add(field[0]);
    }
  }

  // Always add tooltip with remaining unused fields
  const unusedFields = fields.filter(f => !usedFields.has(f[0]));
  if (unusedFields.length > 0) {
    encoding.tooltip = unusedFields.slice(0, 3).map(field => ({
      field: field[0],
      type: getAppropriateType('tooltip', field[0], field[1])
    }));
  }

  return encoding;
};

// Helper to determine appropriate encoding type
const getAppropriateType = (channel: string, field: string, dataType: string): string => {
  switch (channel) {
    case 'x':
    case 'y':
      return dataType === 'temporal' ? 'temporal' : 'quantitative';
    case 'color':
    case 'shape':
      return dataType === 'nominal' || dataType === 'ordinal' ? dataType : 'nominal';
    case 'size':
    case 'strokeWidth':
    case 'theta':
    case 'radius':
      return 'quantitative';
    case 'text':
    case 'tooltip':
      return dataType || 'nominal';
    default:
      return dataType || 'nominal';
  }
};

// Helper function for random choice
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Define ChartEncoding interface correctly to match usage in the file
export interface ChartEncoding {
  [key: string]: EncodingField | EncodingField[] | undefined;
}

/**
 * Generates a proper parallel coordinates chart specification.
 * Parallel coordinates are implemented using a line mark with special transformations
 * rather than a native mark type in Vega-Lite.
 * 
 * Note: This requires special handling in the renderer to ensure the 'filled' property
 * is properly set to false. The mark type must be 'line' for parallel coordinates to render correctly.
 * 
 * @param data The dataset to visualize
 * @param dimensions The data dimensions to include in the parallel coordinates
 * @param detailField Field to use for distinguishing individual lines
 * @param colorField Optional field to use for coloring the lines
 * @param opacityField Optional field to use for varying line opacity
 * @returns A complete TopLevelSpec for a parallel coordinates chart
 */
export const createParallelCoordinatesSpec = (
  data: any[],
  dimensions: string[],
  detailField: string,
  colorField?: string,
  opacityField?: string
): TopLevelSpec => {
  // Default to a few dimensions if none are provided
  const actualDimensions = dimensions.length > 0 ? dimensions : ['dim1', 'dim2', 'dim3'];
  
  // Ensure we have an ID field for detail
  const actualDetailField = data[0]?.[detailField] !== undefined ? detailField : 'id';
  
  // Create the basic spec
  const spec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 500,
    height: 300,
    data: { values: data },
    transform: [
      { fold: actualDimensions }
    ],
    // IMPORTANT: Always use 'line' type directly, not 'parallel-coordinates'
    mark: {
      type: 'line',
      opacity: 0.5
    },
    encoding: {
      x: {
        field: 'key',
        type: 'nominal',
        sort: actualDimensions,
        axis: {
          labelAngle: 0,
          title: null
        }
      },
      y: {
        field: 'value',
        type: 'quantitative',
        scale: { zero: false, nice: true },
        axis: { title: null }
      },
      color: colorField && data[0]?.[colorField] !== undefined ? 
        { field: colorField, type: 'nominal' } : 
        { value: 'steelblue' },
      opacity: opacityField && data[0]?.[opacityField] !== undefined ? 
        { field: opacityField, type: 'quantitative' } : 
        undefined,
      detail: { field: actualDetailField, type: 'nominal' },
      tooltip: [
        { field: actualDetailField, type: 'nominal' },
        { field: 'key', type: 'nominal' },
        { field: 'value', type: 'quantitative' }
      ]
    },
    resolve: {
      scale: {
        y: 'independent'
      }
    }
  };

  // Ensure mark type is always 'line'
  if (typeof spec.mark === 'object') {
    spec.mark.type = 'line';
  }

  return spec;
}; 