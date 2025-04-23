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