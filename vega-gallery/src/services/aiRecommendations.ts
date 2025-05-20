import { DatasetMetadata } from '../types/dataset';
import { ChartType, EncodingField, TooltipEncoding } from '../types/chart';
import { detectDataTypes } from '../utils/dataUtils';

export interface ChartRecommendation {
  chartType: ChartType;
  confidence: number;
  reason: string;
  suggestedEncodings: Record<string, EncodingField | TooltipEncoding>;
}

// Helper functions for data type checking
const isNumeric = (field: string, values: any[]): boolean => {
  return values.some(v => !isNaN(Number(v[field])));
};

const isTimeField = (field: string, values: any[]): boolean => {
  return values.some(v => !isNaN(Date.parse(v[field])));
};

const getUniqueValueCount = (field: string, values: any[]): number => {
  return new Set(values.map(v => v[field])).size;
};

// Add these helper functions for better data analysis
const analyzeDataDistribution = (field: string, values: any[]) => {
  const nums = values.map(v => Number(v[field])).filter(n => !isNaN(n));
  if (nums.length === 0) return null;
  
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length;
  const skewness = nums.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / (nums.length * Math.pow(variance, 1.5));
  const kurtosis = nums.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / (nums.length * Math.pow(variance, 2));
  
  // Get quartiles
  const sorted = nums.sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  return {
    mean,
    variance,
    skewness,
    kurtosis,
    q1,
    q3,
    iqr,
    min: Math.min(...nums),
    max: Math.max(...nums),
    range: Math.max(...nums) - Math.min(...nums),
    uniqueCount: new Set(nums).size,
    outliers: nums.filter(n => n < q1 - 1.5 * iqr || n > q3 + 1.5 * iqr).length
  };
};

const detectPatterns = (values: any[]) => {
  const patterns = {
    hasCyclical: false,
    hasOutliers: false,
    hasGaps: false,
    hasTrend: false,
    hasGrouping: false,
    hasMultiModality: false,
    hasHighVariance: false,
    density: 'sparse' as 'sparse' | 'medium' | 'dense',
    recommendedVisualization: null as string | null
  };

  // Analyze numeric fields for patterns
  Object.keys(values[0] || {}).forEach(field => {
    const distribution = analyzeDataDistribution(field, values);
    if (distribution) {
      // Check for outliers
      if (distribution.outliers > 0) {
        patterns.hasOutliers = true;
      }
      
      // Check for gaps in data
      if (distribution.uniqueCount / distribution.range < 0.1) {
        patterns.hasGaps = true;
      }
      
      // Check for high variance
      if (distribution.variance > (distribution.mean * 2)) {
        patterns.hasHighVariance = true;
      }
      
      // Check for multi-modality (multiple peaks)
      // Simplified approach: if kurtosis is low, might be multi-modal
      if (distribution.kurtosis < 2.5) {
        patterns.hasMultiModality = true;
      }
      
      // Determine data density
      const densityRatio = distribution.uniqueCount / values.length;
      patterns.density = densityRatio < 0.2 ? 'sparse' : densityRatio > 0.8 ? 'dense' : 'medium';
      
      // Detect trends in time series
      if (isTimeField(field, values)) {
        const sortedByTime = [...values].sort((a, b) => 
          new Date(a[field]).getTime() - new Date(b[field]).getTime());
        
        // Check for trend direction (only if there are numeric fields)
        const numericFields = Object.keys(values[0] || {}).filter(f => 
          f !== field && values.some(v => !isNaN(Number(v[f]))));
        
        if (numericFields.length > 0) {
          const firstNumericField = numericFields[0];
          const firstQuartileAvg = sortedByTime.slice(0, Math.floor(sortedByTime.length / 4))
            .reduce((sum, v) => sum + Number(v[firstNumericField]), 0) / Math.floor(sortedByTime.length / 4);
          
          const lastQuartileAvg = sortedByTime.slice(Math.floor(3 * sortedByTime.length / 4))
            .reduce((sum, v) => sum + Number(v[firstNumericField]), 0) / (sortedByTime.length - Math.floor(3 * sortedByTime.length / 4));
          
          // If there's a significant change, there's a trend
          if (Math.abs((lastQuartileAvg - firstQuartileAvg) / firstQuartileAvg) > 0.2) {
            patterns.hasTrend = true;
          }
        }
      }
    }
  });

  return patterns;
};

const analyzeRelationships = (values: any[], fields: string[]) => {
  const relationships: Record<string, {
    type: 'linear' | 'nonlinear' | 'none';
    strength: number;
  }> = {};

  // Analyze relationships between numeric fields
  for (let i = 0; i < fields.length; i++) {
    for (let j = i + 1; j < fields.length; j++) {
      const field1 = fields[i];
      const field2 = fields[j];
      
      const nums1 = values.map(v => Number(v[field1])).filter(n => !isNaN(n));
      const nums2 = values.map(v => Number(v[field2])).filter(n => !isNaN(n));
      
      if (nums1.length > 0 && nums2.length > 0) {
        const correlation = calculateCorrelation(values, field1, field2);
        const key = `${field1}-${field2}`;
        
        relationships[key] = {
          type: Math.abs(correlation) > 0.7 ? 'linear' : 'nonlinear',
          strength: Math.abs(correlation)
        };
      }
    }
  }

  return relationships;
};

// Add the calculateCorrelation function that was referenced
const calculateCorrelation = (values: any[], field1: string, field2: string): number => {
  const pairs = values
    .map(v => [Number(v[field1]), Number(v[field2])])
    .filter(([a, b]) => !isNaN(a) && !isNaN(b));
  
  if (pairs.length < 2) return 0;
  
  const mean1 = pairs.reduce((sum, [a]) => sum + a, 0) / pairs.length;
  const mean2 = pairs.reduce((sum, [_, b]) => sum + b, 0) / pairs.length;
  
  const variance1 = pairs.reduce((sum, [a]) => sum + Math.pow(a - mean1, 2), 0);
  const variance2 = pairs.reduce((sum, [_, b]) => sum + Math.pow(b - mean2, 2), 0);
  
  if (variance1 === 0 || variance2 === 0) return 0;
  
  const covariance = pairs.reduce((sum, [a, b]) => sum + (a - mean1) * (b - mean2), 0);
  return covariance / Math.sqrt(variance1 * variance2);
};

// Add this helper function to create standardized tooltip encodings
const createTooltipEncodings = (fields: string[], dataTypes: Record<string, string>): EncodingField[] => {
  return fields.map(field => ({
    field,
    type: dataTypes[field] || 'nominal',
    title: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
    format: dataTypes[field] === 'temporal' ? '%b %d, %Y' : 
           dataTypes[field] === 'quantitative' ? ',.1f' : 
           undefined
  }));
};

export const getChartRecommendations = (dataset: DatasetMetadata): ChartRecommendation[] => {
  if (!dataset?.values?.length || !dataset.values[0]) return [];
  
  const recommendations: ChartRecommendation[] = [];
  const dataTypes = dataset.dataTypes || {};
  const fields = Object.keys(dataset.values[0] || {});
  
  // Enhanced analysis
  const patterns = detectPatterns(dataset.values);
  const relationships = analyzeRelationships(dataset.values, fields);
  
  // Get field characteristics
  const numericFields = fields.filter(field => isNumeric(field, dataset.values));
  const temporalFields = fields.filter(field => isTimeField(field, dataset.values));
  const categoricalFields = fields.filter(field => {
    const uniqueCount = getUniqueValueCount(field, dataset.values);
    return uniqueCount < Math.min(dataset.values.length * 0.3, 20);
  });

  // For better recommendations, determine which fields are IDs or keys
  const idFields = fields.filter(field => {
    const uniqueCount = getUniqueValueCount(field, dataset.values);
    return uniqueCount === dataset.values.length; // Every value is unique
  });
  
  // Filter out ID fields from numeric fields for better recommendations
  const meaningfulNumericFields = numericFields.filter(field => !idFields.includes(field));

  // 1. SCATTER PLOT RECOMMENDATIONS - Linear relationships
  Object.entries(relationships).forEach(([fieldPair, rel]) => {
    if (rel.type === 'linear' && rel.strength > 0.7) {
      const [field1, field2] = fieldPair.split('-');
      
      // Find a good candidate for color encoding
      const colorField = categoricalFields.length > 0 ? 
        categoricalFields[0] : // Use first categorical field
        (numericFields.length > 2 ? numericFields.find(f => f !== field1 && f !== field2) : null); // Or another numeric field
      
      recommendations.push({
        chartType: 'point',
        confidence: 0.9,
        reason: `Strong linear relationship (correlation: ${rel.strength.toFixed(2)}) detected between "${field1}" and "${field2}". A scatter plot will effectively show this relationship.`,
        suggestedEncodings: {
          x: { field: field1, type: 'quantitative', scale: { zero: false } },
          y: { field: field2, type: 'quantitative', scale: { zero: false } },
          ...(colorField && { color: { 
            field: colorField, 
            type: categoricalFields.includes(colorField) ? 'nominal' : 'quantitative' 
          }}),
          ...(numericFields.length > 3 && numericFields.find(f => f !== field1 && f !== field2 && f !== colorField) && { 
            size: { 
              field: numericFields.find(f => f !== field1 && f !== field2 && f !== colorField) || field1, 
              type: 'quantitative' 
            }
          }),
          tooltip: [
            { field: field1, type: 'quantitative' },
            { field: field2, type: 'quantitative' }
          ] as EncodingField[]
        }
      });
    }
  });

  // 2. BOX PLOT RECOMMENDATIONS - For data with outliers
  if (patterns.hasOutliers && categoricalFields.length > 0) {
    numericFields.forEach(field => {
      const distribution = analyzeDataDistribution(field, dataset.values);
      if (distribution && distribution.outliers > 0) {
        recommendations.push({
          chartType: 'boxplot',
          confidence: 0.85,
          reason: `Detected ${distribution.outliers} outliers in "${field}" across different categories. A box plot will help visualize the distribution and identify outliers.`,
          suggestedEncodings: {
            x: { field: categoricalFields[0], type: 'nominal' },
            y: { field: field, type: 'quantitative' },
            color: { field: categoricalFields[0], type: 'nominal' },
            tooltip: { field: field, type: 'quantitative' }
          }
        });
      }
    });
  }
  
  // 3. TIME SERIES RECOMMENDATIONS - For temporal data
  if (temporalFields.length > 0 && numericFields.length > 0) {
    const timeField = temporalFields[0];
    
    // Line chart for trend data
    if (patterns.hasTrend) {
      meaningfulNumericFields.forEach(field => {
        recommendations.push({
          chartType: 'line',
          confidence: 0.9,
          reason: `Detected trend patterns in "${field}" over time. A line chart will effectively show this trend.`,
          suggestedEncodings: {
            x: { field: timeField, type: 'temporal' },
            y: { field: field, type: 'quantitative' },
            ...(categoricalFields.length > 0 && { color: { 
              field: categoricalFields[0], 
              type: 'nominal' 
            }}),
            tooltip: [
              { field: timeField, type: 'temporal' },
              { field: field, type: 'quantitative' }
            ] as EncodingField[]
          }
        });
      });
    }
    
    // Area chart for cumulative or stacked data
    if (patterns.hasTrend && categoricalFields.length > 0) {
      meaningfulNumericFields.forEach(field => {
        recommendations.push({
          chartType: 'area',
          confidence: 0.85,
          reason: `Detected trends in "${field}" across categories over time. An area chart can show both overall trend and composition.`,
          suggestedEncodings: {
            x: { field: timeField, type: 'temporal' },
            y: { field: field, type: 'quantitative', aggregate: 'sum' },
            color: { field: categoricalFields[0], type: 'nominal' },
            tooltip: [
              { field: timeField, type: 'temporal' },
              { field: field, type: 'quantitative' },
              { field: categoricalFields[0], type: 'nominal' }
            ] as EncodingField[]
          }
        });
      });
    }
  }

  // 4. HEATMAP RECOMMENDATIONS - For dense data
  if (patterns.density === 'dense' && numericFields.length >= 2) {
    recommendations.push({
      chartType: 'heatmap',
      confidence: 0.8,
      reason: `High data density detected. A heatmap can reveal patterns in dense datasets between "${numericFields[0]}" and "${numericFields[1]}".`,
      suggestedEncodings: {
        x: { field: numericFields[0], type: 'quantitative', bin: true },
        y: { field: numericFields[1], type: 'quantitative', bin: true },
        color: { field: '*', type: 'quantitative', aggregate: 'count' },
        tooltip: [
          { field: numericFields[0], type: 'quantitative' },
          { field: numericFields[1], type: 'quantitative' },
          { field: '*', type: 'quantitative', aggregate: 'count', title: 'Count' }
        ] as EncodingField[]
      }
    });
  }

  // 5. VIOLIN PLOT RECOMMENDATIONS - For skewed distributions
  numericFields.forEach(field => {
    const distribution = analyzeDataDistribution(field, dataset.values);
    if (distribution && Math.abs(distribution.skewness) > 1) {
      recommendations.push({
        chartType: 'violin',
        confidence: 0.85,
        reason: `"${field}" shows a skewed distribution (skewness: ${distribution.skewness.toFixed(2)}). A violin plot will reveal the full shape of the distribution.`,
        suggestedEncodings: {
          x: { field: categoricalFields[0] || field, type: categoricalFields.length ? 'nominal' : 'quantitative' },
          y: { field: field, type: 'quantitative' },
          color: { field: categoricalFields[0] || 'datum', type: categoricalFields.length ? 'nominal' : 'quantitative' },
          tooltip: { field: field, type: 'quantitative' }
        }
      });
    }
  });

  // 6. BAR CHART RECOMMENDATIONS - For categorical comparisons
  if (categoricalFields.length > 0 && meaningfulNumericFields.length > 0) {
    const uniqueValues = getUniqueValueCount(categoricalFields[0], dataset.values);
    if (uniqueValues <= 15) { // Not too many categories
      const field = meaningfulNumericFields[0];
      recommendations.push({
        chartType: 'bar',
        confidence: 0.9,
        reason: `Found ${uniqueValues} categories in "${categoricalFields[0]}" with numeric values in "${field}". Bar charts excel at showing categorical comparisons.`,
        suggestedEncodings: {
          x: { field: categoricalFields[0], type: 'nominal', sort: '-y' }, // Sort by value descending
          y: { field: field, type: 'quantitative' },
          color: { field: categoricalFields[0], type: 'nominal' },
          tooltip: [
            { field: categoricalFields[0], type: 'nominal' },
            { field: field, type: 'quantitative' }
          ] as EncodingField[]
        }
      });
      
      // Horizontal bar chart for long category names
      const sampleCategoryLength = dataset.values[0]?.[categoricalFields[0]]?.toString().length || 0;
      if (sampleCategoryLength > 10) {
        recommendations.push({
          chartType: 'bar',
          confidence: 0.85,
          reason: `Categories in "${categoricalFields[0]}" have long names. A horizontal bar chart will display them better.`,
          suggestedEncodings: {
            y: { field: categoricalFields[0], type: 'nominal', sort: '-x' }, // Y-axis for categories, sorted
            x: { field: field, type: 'quantitative' },
            color: { field: categoricalFields[0], type: 'nominal' },
            tooltip: [
              { field: categoricalFields[0], type: 'nominal' },
              { field: field, type: 'quantitative' }
            ] as EncodingField[]
          }
        });
      }
      
      // Grouped bar chart if there's a second categorical field
      if (categoricalFields.length > 1) {
        recommendations.push({
          chartType: 'bar',
          confidence: 0.8,
          reason: `Found two categorical fields which can be compared using a grouped bar chart.`,
          suggestedEncodings: {
            x: { field: categoricalFields[0], type: 'nominal' },
            y: { field: field, type: 'quantitative' },
            color: { field: categoricalFields[1], type: 'nominal' },
            column: { field: categoricalFields[1], type: 'nominal' },
            tooltip: [
              { field: categoricalFields[0], type: 'nominal' },
              { field: categoricalFields[1], type: 'nominal' },
              { field: field, type: 'quantitative' }
            ] as EncodingField[]
          }
        });
      }
    }
  }

  // 7. PIE/DONUT CHART RECOMMENDATIONS - For part-to-whole relationships
  if (categoricalFields.length > 0 && meaningfulNumericFields.length > 0) {
    const uniqueValues = getUniqueValueCount(categoricalFields[0], dataset.values);
    if (uniqueValues <= 6) { // Few segments for readability
      recommendations.push({
        chartType: 'arc',
        confidence: 0.75,
        reason: `Found categorical field "${categoricalFields[0]}" with ${uniqueValues} categories. Pie/donut charts work well for showing proportions when there aren't too many segments.`,
        suggestedEncodings: {
          theta: { 
            field: meaningfulNumericFields[0], 
            type: 'quantitative',
            aggregate: 'sum'
          },
          color: { field: categoricalFields[0], type: 'nominal' },
          tooltip: [
            { field: categoricalFields[0], type: 'nominal' },
            { field: meaningfulNumericFields[0], type: 'quantitative', aggregate: 'sum' }
          ] as EncodingField[]
        }
      });
    }
  }

  // 8. TREEMAP RECOMMENDATIONS - For hierarchical data
  const potentialHierarchyFields = categoricalFields.filter(f => 
    f.toLowerCase().includes('category') || 
    f.toLowerCase().includes('type') || 
    f.toLowerCase().includes('group')
  );
  
  if (potentialHierarchyFields.length > 0 && meaningfulNumericFields.length > 0) {
    recommendations.push({
      chartType: 'treemap',
      confidence: 0.7,
      reason: `Field "${potentialHierarchyFields[0]}" could represent a category hierarchy. Treemaps are effective for showing hierarchical data with size relationships.`,
      suggestedEncodings: {
        size: { 
          field: meaningfulNumericFields[0], 
          type: 'quantitative',
          aggregate: 'sum'
        },
        color: { 
          field: potentialHierarchyFields[0],
          type: 'nominal'
        },
        tooltip: [
          { field: potentialHierarchyFields[0], type: 'nominal' },
          { field: meaningfulNumericFields[0], type: 'quantitative', aggregate: 'sum' }
        ] as EncodingField[]
      }
    });
  }

  // Modify existing recommendations to ensure they all have proper tooltips
  return recommendations
    .map(rec => {
      // If tooltip is missing or not comprehensive, enhance it
      const hasProperTooltip = rec.suggestedEncodings.tooltip && 
        (Array.isArray(rec.suggestedEncodings.tooltip) || 
         'field' in rec.suggestedEncodings.tooltip);
      
      if (!hasProperTooltip) {
        // Create tooltips based on the encodings used
        const encodedFields = Object.values(rec.suggestedEncodings)
          .filter(enc => enc && !Array.isArray(enc) && 'field' in enc)
          .map(enc => (enc as EncodingField).field)
          .filter(field => field !== '*' && field !== 'datum');
        
        // Add 2-3 most relevant fields as tooltips
        const tooltipFields = [...new Set(encodedFields)].slice(0, 3);
        
        // Add tooltips to the recommendation
        return {
          ...rec,
          suggestedEncodings: {
            ...rec.suggestedEncodings,
            tooltip: createTooltipEncodings(tooltipFields, 
              dataset.dataTypes || detectDataTypes(dataset.values))
          }
        };
      }
      
      return rec;
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
};

// Add these helper functions
const analyzeDistribution = (field: string, values: any[]) => {
  const nums = values.map(v => Number(v[field])).filter(n => !isNaN(n));
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length;
  const skewness = nums.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / (nums.length * Math.pow(variance, 1.5));
  return { mean, variance, skewness };
};

const detectSeasonality = (timeField: string, valueField: string, values: any[]) => {
  // Sort by time
  const sorted = [...values].sort((a, b) => new Date(a[timeField]).getTime() - new Date(b[timeField]).getTime());
  
  // Check for repeating patterns
  const diffs = [];
  for (let i = 1; i < sorted.length; i++) {
    diffs.push(sorted[i][valueField] - sorted[i-1][valueField]);
  }
  
  // Look for sign changes in differences (peaks and valleys)
  let signChanges = 0;
  for (let i = 1; i < diffs.length; i++) {
    if (Math.sign(diffs[i]) !== Math.sign(diffs[i-1])) {
      signChanges++;
    }
  }
  
  return signChanges > (sorted.length / 4); // Arbitrary threshold
};