import { MarkType } from '../types/vega';
import { DatasetMetadata } from '../types/dataset';

// Type for dataset values array
type DatasetValues = any[];

// Function to validate dataset structure and content
export function validateDataset(dataset: DatasetValues): boolean {
  // Ensure the dataset is not empty
  if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
    console.error("Dataset validation failed: Empty dataset");
    return false;
  }

  // Check that the first item is an object
  const firstItem = dataset[0];
  if (typeof firstItem !== 'object' || firstItem === null) {
    console.error("Dataset validation failed: First item is not an object");
    return false;
  }

  // Get expected properties from the first item
  const expectedKeys = Object.keys(firstItem);
  if (expectedKeys.length === 0) {
    console.error("Dataset validation failed: First item has no properties");
    return false;
  }

  // Check if all items have the same structure
  for (let i = 1; i < dataset.length; i++) {
    const item = dataset[i];
    
    // Check that it's an object
    if (typeof item !== 'object' || item === null) {
      console.error(`Dataset validation failed: Item at index ${i} is not an object`);
      return false;
    }
    
    // Check keys
    const itemKeys = Object.keys(item);
    const missingKeys = expectedKeys.filter(key => !itemKeys.includes(key));
    const extraKeys = itemKeys.filter(key => !expectedKeys.includes(key));
    
    if (missingKeys.length > 0 || extraKeys.length > 0) {
      console.error(`Dataset validation failed: Inconsistent structure at index ${i}`, 
        { missingKeys, extraKeys });
      return false;
    }
    
    // Check for null or undefined values
    for (const key of expectedKeys) {
      if (item[key] === undefined) {
        console.error(`Dataset validation failed: Undefined value at index ${i} for key ${key}`);
        return false;
      }
    }
  }

  // Check for basic data quality issues
  for (const key of expectedKeys) {
    // Check if the field is numeric
    const numericValues = dataset
      .map(item => item[key])
      .filter(value => typeof value === 'number' && !isNaN(value));
    
    if (numericValues.length > 0) {
      // Check for extreme outliers
      const avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      const maxDeviation = numericValues.reduce((max, val) => 
        Math.max(max, Math.abs(val - avg)), 0);
      
      // If the max deviation is more than 1000x the average (and average is not 0),
      // flag as potential issue
      if (avg !== 0 && maxDeviation / Math.abs(avg) > 1000) {
        console.warn(`Dataset contains potential outliers in field "${key}"`);
        // Don't fail validation for outliers, just warn
      }
    }
  }

  return true;
}

export const detectDataTypes = (data: any[]): Record<string, string> => {
  if (!data || data.length === 0) return {};
  
  const firstRow = data[0];
  const columns = Object.keys(firstRow);
  
  return columns.reduce((types, col) => {
    // Get a sample of values for this column
    const sampleValues = data
      .slice(0, 100)  // Take first 100 rows as sample
      .map(row => row[col])
      .filter(val => val != null);  // Remove null/undefined

    if (sampleValues.length === 0) {
      types[col] = 'nominal';
      return types;
    }

    // Check if all values are numbers
    const isNumeric = sampleValues.every(val => 
      typeof val === 'number' || 
      (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '')
    );
    if (isNumeric) {
      types[col] = 'quantitative';
      return types;
    }

    // Check if all values are dates
    const isDate = sampleValues.every(val => !isNaN(Date.parse(String(val))));
    if (isDate) {
      types[col] = 'temporal';
      return types;
    }

    // Check if it could be ordinal (limited unique values)
    const uniqueValues = new Set(sampleValues);
    if (uniqueValues.size <= 20) {
      types[col] = 'ordinal';
      return types;
    }

    // Default to nominal
    types[col] = 'nominal';
    return types;
  }, {} as Record<string, string>);
};

// Helper function to detect a single column type
export const detectColumnType = (values: any[]): string => {
  const cleanValues = values.filter(v => v != null);
  if (cleanValues.length === 0) return 'nominal';

  // Check if all values are numbers
  const isNumeric = cleanValues.every(val => 
    typeof val === 'number' || 
    (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '')
  );
  if (isNumeric) return 'quantitative';

  // Check if all values are dates
  const isDate = cleanValues.every(val => !isNaN(Date.parse(String(val))));
  if (isDate) return 'temporal';

  // Check if it could be ordinal
  const uniqueValues = new Set(cleanValues);
  if (uniqueValues.size <= 20) return 'ordinal';

  // Default to nominal
  return 'nominal';
};

export function determineCompatibleCharts(metadata: DatasetMetadata): MarkType[] {
  if (!metadata || !metadata.values || metadata.values.length === 0) {
    return [];
  }
  
  const dataTypes = metadata.dataTypes || detectDataTypes(metadata.values);
  const types = new Set(Object.values(dataTypes));
  const charts: MarkType[] = [];
  
  // Quantitative data enables many chart types
  if (types.has('quantitative')) {
    charts.push('bar', 'line', 'point', 'area', 'boxplot', 'violin');
    
    // If we have multiple quantitative fields, enable more charts
    if (Object.values(dataTypes).filter(t => t === 'quantitative').length > 1) {
      charts.push('circle', 'square');
    }
    
    // Add density plot for single quantitative field
    if (Object.values(dataTypes).filter(t => t === 'quantitative').length === 1 &&
        !types.has('temporal') && 
        !types.has('nominal') && 
        !types.has('ordinal')) {
      charts.push('area'); // density plot uses area mark
    }
  }

  // Temporal data works well with trend-showing charts
  if (types.has('temporal')) {
    charts.push('line', 'area', 'point', 'bar', 'trail');
  }

  // Categorical/Nominal data works with discrete charts
  if (types.has('nominal') || types.has('ordinal')) {
    charts.push('bar', 'point', 'text', 'tick');
    
    // If we have quantitative data too, enable more charts
    if (types.has('quantitative')) {
      charts.push('boxplot', 'violin');
    }
  }

  // Hierarchical relationships enable specific chart types
  if (Object.keys(dataTypes).some(k => 
    k.includes('parent') || k.includes('source') || k.includes('target'))) {
    charts.push('treemap', 'sunburst');
    
    if (Object.keys(dataTypes).some(k => k.includes('source') || k.includes('target'))) {
      charts.push('force-directed', 'chord-diagram');
    }
  }

  // Text data enables word-related visualizations
  if (Object.keys(dataTypes).some(k => k.includes('text') || k.includes('label'))) {
    charts.push('text', 'wordcloud');
  }

  return [...new Set(charts)] as MarkType[];
}

export const isDatasetCompatibleWithChart = (
  dataset: DatasetMetadata,
  chartType: MarkType
): boolean => {
  if (!dataset || !dataset.values || dataset.values.length === 0) {
    return false;
  }
  
  const compatibleCharts = determineCompatibleCharts(dataset);
  
  // Special compatibility rules
  if (chartType === 'arc' || chartType === 'pie') {
    // Pie charts require at least one categorical and one quantitative field
    const dataTypes = dataset.dataTypes || detectDataTypes(dataset.values);
    const hasQuantitative = Object.values(dataTypes).some(type => type === 'quantitative');
    const hasCategorical = Object.values(dataTypes).some(
      type => type === 'nominal' || type === 'ordinal'
    );
    return hasQuantitative && hasCategorical;
  }
  
  return compatibleCharts.includes(chartType);
};

export const cleanData = (data: any[]): any[] => {
  return data.map(row => {
    const cleaned = { ...row };
    Object.entries(cleaned).forEach(([key, value]) => {
      // Try to parse dates
      if (typeof value === 'string' && !isNaN(Date.parse(value))) {
        cleaned[key] = new Date(value);
      }
      // Clean numbers
      if (typeof value === 'string' && !isNaN(Number(value))) {
        cleaned[key] = Number(value);
      }
      // Handle nulls
      if (value === '' || value === null || value === undefined) {
        cleaned[key] = null;
      }
    });
    return cleaned;
  });
};

export const inferDataTypes = (data: any[]): Record<string, string[]> => {
  if (!data.length) return {};
  
  const types: Record<string, Set<string>> = {};
  const fields = Object.keys(data[0]);

  fields.forEach(field => {
    types[field] = new Set();
    data.forEach(row => {
      const value = row[field];
      if (typeof value === 'number') types[field].add('quantitative');
      if (value instanceof Date) types[field].add('temporal');
      if (typeof value === 'string') {
        if (!isNaN(Date.parse(value))) types[field].add('temporal');
        else if (!isNaN(Number(value))) types[field].add('quantitative');
        else types[field].add('nominal');
      }
    });
  });

  return Object.fromEntries(
    Object.entries(types).map(([field, typeSet]) => [field, Array.from(typeSet)])
  );
};

export const inferChartType = (dataset: DatasetValues): MarkType => {
  if (!dataset || dataset.length === 0) {
    return 'point';
  }

  const dataTypes = detectDataTypes(dataset);
  const fields = Object.keys(dataTypes);

  // Count field types
  const numericFields = fields.filter(
    field => dataTypes[field] === 'quantitative'
  ).length;
  
  const categoricalFields = fields.filter(
    field => dataTypes[field] === 'nominal' || dataTypes[field] === 'ordinal'
  ).length;
  
  const temporalFields = fields.filter(
    field => dataTypes[field] === 'temporal'
  ).length;

  // Determine chart type based on data types
  if (numericFields >= 2 && categoricalFields === 0) {
    return 'point'; // Scatter plot for numeric-numeric
  } else if (temporalFields === 1 && numericFields >= 1) {
    return 'line'; // Line chart for time series
  } else if (categoricalFields === 1 && numericFields === 1) {
    // For a single categorical and a single numeric field, recommend a bar chart
    // If the dataset is small (few categories), also consider pie chart
    if (dataset.length <= 8) {
      return 'pie'; // Pie chart for categorical data with few categories
    }
    return 'bar'; // Bar chart for categorical-numeric
  } else if (categoricalFields >= 1 && numericFields >= 1) {
    return 'bar';
  } else if (numericFields >= 3) {
    return 'parallel-coordinates'; // Parallel coordinates for multi-dimensional numeric data
  } else if (categoricalFields >= 2 && numericFields === 0) {
    return 'treemap'; // Treemap for hierarchical categorical data
  }
  
  // Default to point (scatter plot)
  return 'point';
};

/**
 * Generates a SHA-256 hash of the dataset content
 * @param data The dataset to fingerprint
 * @returns SHA-256 hash as a string
 */
export const generateDataFingerprint = async (data: any[]): Promise<string> => {
  if (!data || data.length === 0) return '';
  
  try {
    // Convert data to a stable string representation
    const stableString = JSON.stringify(data, Object.keys(data[0]).sort());
    
    // Use browser's crypto API to generate a hash
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(stableString);
    
    // Use browser's crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    // Convert hash to hex string
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.error('Failed to generate data fingerprint:', error);
    return `error-${Date.now()}`;
  }
};

/**
 * Creates preview rows from dataset
 * @param data Full dataset
 * @param count Number of preview rows to generate
 * @returns Array of preview rows
 */
export const generatePreviewRows = (data: any[], count: number = 10): any[] => {
  if (!data || data.length === 0) return [];
  return data.slice(0, Math.min(count, data.length));
};

/**
 * Enhances a dataset with complete metadata
 * @param dataset Partial dataset metadata
 * @param data Dataset values
 * @returns Complete dataset metadata
 */
export const enhanceDatasetMetadata = async (
  dataset: Partial<DatasetMetadata>, 
  data: any[]
): Promise<DatasetMetadata> => {
  const now = new Date().toISOString();
  
  // Generate field types if not provided
  const fieldTypes = dataset.dataTypes || detectDataTypes(data);
  
  // Generate compatible charts
  const compatibleCharts = dataset.compatibleCharts || 
    determineCompatibleCharts({ 
      id: dataset.id || '', 
      name: dataset.name || '', 
      createdAt: dataset.createdAt || now,
      dataTypes: fieldTypes, 
      values: data 
    });
  
  // Generate fingerprint
  const fingerprint = await generateDataFingerprint(data);
  
  return {
    id: dataset.id || `dataset-${Date.now()}`,
    name: dataset.name || 'Unnamed Dataset',
    description: dataset.description || '',
    createdAt: dataset.createdAt || now,
    updatedAt: dataset.updatedAt || now,
    values: data,
    columns: data.length > 0 ? Object.keys(data[0]) : [],
    rowCount: data.length,
    columnCount: data.length > 0 ? Object.keys(data[0]).length : 0,
    dataTypes: fieldTypes,
    fieldTypes: Object.entries(fieldTypes).reduce((acc, [key, type]) => {
      let jsType = 'string';
      if (type === 'quantitative') jsType = 'number';
      if (type === 'temporal') jsType = 'date';
      if (type === 'boolean') jsType = 'boolean';
      acc[key] = jsType as any;
      return acc;
    }, {} as Record<string, any>),
    compatibleCharts,
    fingerprint,
    previewRows: generatePreviewRows(data, 10),
    source: dataset.source || 'manual upload',
    origin: dataset.origin || 'manual upload',
    tags: dataset.tags || [],
    linkedChartIds: dataset.linkedChartIds || [],
    ...dataset
  };
};

/**
 * Creates a sample of a large dataset for performance optimization
 * @param data The full dataset
 * @param sampleSize Maximum number of rows to include in the sample
 * @returns A representative sample of the data
 */
export const createDataSample = (data: any[], sampleSize: number = 1000): any[] => {
  if (!data || data.length === 0) return [];
  
  // If data is smaller than sample size, return the whole dataset
  if (data.length <= sampleSize) return data;
  
  // For very large datasets, do stratified sampling
  if (data.length > 10000) {
    return stratifiedSampling(data, sampleSize);
  }
  
  // For medium datasets, take evenly spaced samples
  const interval = Math.floor(data.length / sampleSize);
  return data.filter((_, index) => index % interval === 0).slice(0, sampleSize);
};

/**
 * Performs stratified sampling on a dataset to maintain distribution characteristics
 * @param data The full dataset
 * @param sampleSize Maximum number of rows
 * @returns A stratified sample
 */
export const stratifiedSampling = (data: any[], sampleSize: number): any[] => {
  // Take some from beginning, middle, and end to capture trends
  const firstPart = Math.floor(sampleSize * 0.4);
  const middlePart = Math.floor(sampleSize * 0.2);
  const lastPart = sampleSize - firstPart - middlePart;
  
  const beginning = data.slice(0, firstPart);
  
  // Get middle section
  const middleStart = Math.floor(data.length / 2) - Math.floor(middlePart / 2);
  const middle = data.slice(middleStart, middleStart + middlePart);
  
  // Get end section
  const end = data.slice(data.length - lastPart);
  
  return [...beginning, ...middle, ...end];
};

/**
 * Creates a paginated view of a dataset
 * @param data The full dataset
 * @param page Current page number (1-based)
 * @param pageSize Number of items per page
 * @returns The current page of data
 */
export const paginateData = (data: any[], page: number = 1, pageSize: number = 50): any[] => {
  if (!data || data.length === 0) return [];
  
  const startIndex = (page - 1) * pageSize;
  return data.slice(startIndex, startIndex + pageSize);
};

/**
 * Processes large datasets in chunks to avoid UI freezing
 * @param data The dataset to process
 * @param processFn The function to apply to each chunk
 * @param chunkSize Number of items to process in each chunk
 * @param onProgress Optional callback for progress updates
 * @returns Promise that resolves when processing is complete
 */
export const processInChunks = async (
  data: any[], 
  processFn: (chunk: any[]) => any[],
  chunkSize: number = 1000,
  onProgress?: (progress: number) => void
): Promise<any[]> => {
  if (!data || data.length === 0) return [];
  
  const result: any[] = [];
  const totalChunks = Math.ceil(data.length / chunkSize);
  
  for (let i = 0; i < totalChunks; i++) {
    const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
    
    // Process each chunk with a small delay to allow UI updates
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const processedChunk = processFn(chunk);
    result.push(...processedChunk);
    
    if (onProgress) {
      onProgress((i + 1) / totalChunks);
    }
  }
  
  return result;
}; 