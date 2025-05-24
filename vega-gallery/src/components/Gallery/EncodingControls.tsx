import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { generateRandomEncoding } from '../../utils/chartAdapters';
import { detectDataTypes } from '../../utils/dataUtils';

// Import types correctly to avoid type mismatches
import { TopLevelSpec } from 'vega-lite';

// Define the correct encoding type structure
interface EncodingDef {
  field?: string;
  type?: string;
  aggregate?: string;
  timeUnit?: string;
  bin?: boolean | object;
  scale?: any;
  sort?: any;
  value?: any;
  [key: string]: any;
}

// Our internal ChartEncoding type should match Vega-Lite's expectation
interface ChartEncoding {
  [key: string]: EncodingDef | EncodingDef[] | undefined;
}

// First, define a proper type for the field stats
interface FieldStats {
  uniqueCount: number;
  uniqueRatio: number;
  dataType: string;
}

// Add proper bin configuration type
interface BinConfig {
  maxbins?: number;
  [key: string]: any;
}

const EncodingSection = styled.div`
  margin-top: 16px;
`;

const EncodingRow = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
`;

const EncodingLabel = styled.div`
  font-size: 14px;
  color: #666;
`;

const EncodingTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const StyledButton = styled(Button)`
  && {
    height: 32px;
    font-size: 13px;
    text-transform: none;
    padding: 4px 12px;
  }
`;

const EncodingOptionContainer = styled.div`
  margin-top: 4px;
`;

const EncodingOptionSelect = styled.select`
  width: 100%;
  padding: 4px 8px;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  margin-top: 4px;
`;

// Options for encoding transformations
const AGGREGATION_OPTIONS = [
  { value: '', label: 'No Aggregation' },
  { value: 'sum', label: 'Sum' },
  { value: 'mean', label: 'Mean/Average' },
  { value: 'median', label: 'Median' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Count' }
];

const TIME_UNIT_OPTIONS = [
  { value: '', label: 'No Time Unit' },
  { value: 'year', label: 'Year' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
  { value: 'hour', label: 'Hour' },
  { value: 'minute', label: 'Minute' }
];

const BINNING_OPTIONS = [
  { value: '', label: 'No Binning' },
  { value: 'bin', label: 'Auto Bin' },
  { value: 'bin-5', label: '5 Bins' },
  { value: 'bin-10', label: '10 Bins' },
  { value: 'bin-20', label: '20 Bins' }
];

const EncodingSuggestionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const EncodingSuggestionCard = styled.button`
  background: var(--color-surface);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #2196f3;
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
  }
`;

const EncodingPreview = styled.div`
  font-size: 0.85rem;
  color: #666;
  margin-top: 8px;
  font-family: monospace;
  border-top: 1px solid var(--color-border);
  padding-top: 8px;
`;

const EncodingName = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const EncodingDescription = styled.div`
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 8px;
`;

interface EncodingControlsProps {
  chartType: string;
  dataset: any;
  onEncodingChange: (encodings: ChartEncoding | null) => void;
  availableFields: string[];
  children?: React.ReactNode;
}

export const EncodingControls: React.FC<EncodingControlsProps> = ({
  chartType,
  dataset,
  onEncodingChange,
  availableFields,
  children
}) => {
  const [suggestedEncodings, setSuggestedEncodings] = useState<Array<{
    name: string;
    description: string;
    encoding: ChartEncoding;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionSource, setSuggestionSource] = useState<'smart' | 'random'>('smart');

  const generateEncodingSuggestions = (source: 'smart' | 'random') => {
    if (availableFields.length === 0) {
      console.warn('No available fields for encoding');
      return;
    }
    
    // Detect data types for available fields
    const dataTypes = dataset && dataset.length > 0 
      ? detectDataTypes(dataset) 
      : availableFields.reduce((acc, field) => ({...acc, [field]: 'nominal'}), {});
    
    let suggestions: Array<{
      name: string;
      description: string;
      encoding: ChartEncoding;
    }> = [];

    if (source === 'random') {
      // Generate 4 different random encoding variations
      for (let i = 0; i < 4; i++) {
        const randomEncoding = generateRandomEncoding(chartType, availableFields, dataTypes);
        suggestions.push({
          name: `Random Variation ${i + 1}`,
          description: getEncodingDescription(randomEncoding, chartType),
          encoding: randomEncoding
        });
      }
    } else {
      // Generate smart encoding suggestions based on chart type
      suggestions = generateSmartSuggestions(chartType, availableFields, dataTypes, dataset);
    }
    
    setSuggestedEncodings(suggestions);
    setSuggestionSource(source);
    setShowSuggestions(true);
  };

  const handleRandomizeEncodings = () => {
    generateEncodingSuggestions('random');
  };

  const handleSmartEncodings = () => {
    generateEncodingSuggestions('smart');
  };

  const applySuggestion = (encoding: ChartEncoding) => {
    // Log the selected encoding for debugging
    console.log("Applying encoding suggestion:", encoding);
    
    // Make sure we're copying the encoding to avoid reference issues
    const processedEncoding = { ...encoding };
    
    // Ensure all channel objects are properly formatted for Vega-Lite
    Object.entries(processedEncoding).forEach(([channel, enc]) => {
      if (!enc) return;
      
      // Handle tooltips separately as they can be arrays
      if (channel === 'tooltip' && Array.isArray(enc)) {
        // Make sure each tooltip item is properly formatted
        processedEncoding[channel] = enc.map(item => ({
          field: item.field,
          type: item.type,
          ...(item.aggregate && { aggregate: item.aggregate }),
          ...(item.timeUnit && { timeUnit: item.timeUnit }),
          ...(item.bin && { bin: item.bin })
        }));
      } else if (typeof enc === 'object') {
        // For regular encoding channels
        const fieldDef = enc as any;
        
        // Make sure null fields are handled properly for count aggregations
        if (fieldDef.aggregate === 'count' && !fieldDef.field) {
          fieldDef.field = '*'; // Use asterisk for count aggregations
        }
        
        // Ensure bin property is correctly formatted
        if (fieldDef.bin && typeof fieldDef.bin === 'string') {
          // Convert string bin formats to proper objects
          if (fieldDef.bin.startsWith('bin-')) {
            const binCount = parseInt(fieldDef.bin.split('-')[1]);
            fieldDef.bin = { maxbins: binCount };
          } else if (fieldDef.bin === 'bin') {
            fieldDef.bin = true;
          }
        }
        
        // Make sure the encoding object is properly formatted
        processedEncoding[channel] = {
          ...(fieldDef.field && { field: fieldDef.field }),
          ...(fieldDef.type && { type: fieldDef.type }),
          ...(fieldDef.aggregate && { aggregate: fieldDef.aggregate }),
          ...(fieldDef.timeUnit && { timeUnit: fieldDef.timeUnit }),
          ...(fieldDef.bin !== undefined && { bin: fieldDef.bin }),
          ...(fieldDef.scale && { scale: fieldDef.scale }),
          ...(fieldDef.sort && { sort: fieldDef.sort }),
          ...(fieldDef.value !== undefined && { value: fieldDef.value })
        };
      }
    });
    
    // Ensure we don't lose any width/height settings from dimensions like width, height
    // Set controlled dimensions for Vega-Lite to ensure proper rendering without affecting resizing
    console.log("Applying processed encoding with width/height preservation");
    
    // Apply the processed encoding
    onEncodingChange(processedEncoding);
    
    // Close the dialog
    setShowSuggestions(false);
    
    // Force a resize event after a short delay to ensure chart adjusts properly
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  const getEncodingDescription = (encoding: ChartEncoding, chartType: string): string => {
    const channels = Object.keys(encoding).filter(k => k !== 'tooltip');
    
    if (channels.length === 0) return "Empty encoding";
    
    const mainFeatures = [];
    
    // Check for key features
    if (encoding.x && encoding.y) {
      const xType = getEncodingType(encoding.x);
      const yType = getEncodingType(encoding.y);
      
      if (xType === 'temporal' && yType === 'quantitative') {
        mainFeatures.push("Time series");
      } else if (xType === 'nominal' && yType === 'quantitative') {
        mainFeatures.push("Category comparison");
      } else if (xType === 'quantitative' && yType === 'quantitative') {
        mainFeatures.push("Scatter plot");
      }
    }
    
    // Check for aggregations
    const hasAggregation = Object.values(encoding).some(e => {
      if (!e) return false;
      if (Array.isArray(e)) {
        return e.some(item => item.aggregate);
      }
      return 'aggregate' in e && e.aggregate;
    });
    if (hasAggregation) mainFeatures.push("Aggregated data");
    
    // Check for binning
    const hasBinning = Object.values(encoding).some(e => {
      if (!e) return false;
      if (Array.isArray(e)) {
        return e.some(item => item.bin);
      }
      return 'bin' in e && e.bin;
    });
    if (hasBinning) mainFeatures.push("Binned data");
    
    // Check for time units
    const hasTimeUnit = Object.values(encoding).some(e => {
      if (!e) return false;
      if (Array.isArray(e)) {
        return e.some(item => item.timeUnit);
      }
      return 'timeUnit' in e && e.timeUnit;
    });
    if (hasTimeUnit) mainFeatures.push("Time unit grouping");
    
    return mainFeatures.join(", ") || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart`;
  };

  const generateSmartSuggestions = (
    chartType: string, 
    availableFields: string[], 
    dataTypes: Record<string, string>,
    dataset: any[]
  ) => {
    const suggestions: Array<{
      name: string;
      description: string;
      encoding: ChartEncoding;
    }> = [];
    
    // Update how we store and access field stats
    const fieldStats: Record<string, FieldStats> = {};

    // Get stats for each field
    availableFields.forEach(field => {
      if (!dataset || dataset.length === 0) return;
      
      const values = dataset.map(d => d[field]).filter(v => v != null);
      const uniqueCount = new Set(values).size;
      const totalCount = values.length;
      const uniqueRatio = uniqueCount / totalCount;
      
      fieldStats[field] = {
        uniqueCount,
        uniqueRatio,
        dataType: dataTypes[field]
      };
    });

    // Helper for categorizing fields
    const categoricalFields = availableFields.filter(f => 
      dataTypes[f] === 'nominal' || dataTypes[f] === 'ordinal');
      
    const quantitativeFields = availableFields.filter(f => 
      dataTypes[f] === 'quantitative');
      
    const temporalFields = availableFields.filter(f => 
      dataTypes[f] === 'temporal');

    // Generate specific suggestions based on chart type
    switch (chartType) {
      case 'bar':
        // Suggestion 1: Basic bar chart with categories and values
        if (categoricalFields.length && quantitativeFields.length) {
          suggestions.push({
            name: "Basic Bar Chart",
            description: "Categories on x-axis, values on y-axis",
            encoding: {
              x: { field: categoricalFields[0], type: dataTypes[categoricalFields[0]] },
              y: { field: quantitativeFields[0], type: 'quantitative' }
            }
          });
        }
        
        // Suggestion 2: Aggregated bar chart (sum)
        if (categoricalFields.length && quantitativeFields.length) {
          suggestions.push({
            name: "Aggregated Bar Chart (Sum)",
            description: "Sum of values grouped by category",
            encoding: {
              x: { field: categoricalFields[0], type: dataTypes[categoricalFields[0]] },
              y: { field: quantitativeFields[0], type: 'quantitative', aggregate: 'sum' }
            }
          });
        }
        
        // Suggestion 3: Aggregated bar chart (mean/average)
        if (categoricalFields.length && quantitativeFields.length) {
          suggestions.push({
            name: "Aggregated Bar Chart (Average)",
            description: "Average of values grouped by category",
            encoding: {
              x: { field: categoricalFields[0], type: dataTypes[categoricalFields[0]] },
              y: { field: quantitativeFields[0], type: 'quantitative', aggregate: 'mean' }
            }
          });
        }
        
        // Suggestion 4: Grouped bars with color
        if (categoricalFields.length >= 2 && quantitativeFields.length) {
          suggestions.push({
            name: "Grouped Bar Chart",
            description: "Multiple categories with color grouping",
            encoding: {
              x: { field: categoricalFields[0], type: dataTypes[categoricalFields[0]] },
              y: { field: quantitativeFields[0], type: 'quantitative', aggregate: 'sum' },
              color: { field: categoricalFields[1], type: dataTypes[categoricalFields[1]] }
            }
          });
        }
        break;
        
      case 'line':
        // Suggestion 1: Basic time series
        if (temporalFields.length && quantitativeFields.length) {
          suggestions.push({
            name: "Time Series",
            description: "Values over time",
            encoding: {
              x: { field: temporalFields[0], type: 'temporal' },
              y: { field: quantitativeFields[0], type: 'quantitative' }
            }
          });
        }
        
        // Suggestion 2: Time series with monthly grouping
        if (temporalFields.length && quantitativeFields.length) {
          suggestions.push({
            name: "Monthly Trends",
            description: "Values aggregated by month",
            encoding: {
              x: { field: temporalFields[0], type: 'temporal', timeUnit: 'month' },
              y: { field: quantitativeFields[0], type: 'quantitative', aggregate: 'mean' }
            }
          });
        }
        
        // Suggestion 3: Multiple series with color
        if (temporalFields.length && quantitativeFields.length && categoricalFields.length) {
          suggestions.push({
            name: "Multiple Time Series",
            description: "Different series shown by color",
            encoding: {
              x: { field: temporalFields[0], type: 'temporal' },
              y: { field: quantitativeFields[0], type: 'quantitative' },
              color: { field: categoricalFields[0], type: dataTypes[categoricalFields[0]] }
            }
          });
        }
        
        // Suggestion 4: Year-over-year comparison
        if (temporalFields.length && quantitativeFields.length) {
          suggestions.push({
            name: "Year Comparison",
            description: "Compare values by year",
            encoding: {
              x: { field: temporalFields[0], type: 'temporal', timeUnit: 'month' },
              y: { field: quantitativeFields[0], type: 'quantitative', aggregate: 'sum' },
              color: { field: temporalFields[0], type: 'temporal', timeUnit: 'year' }
            }
          });
        }
        break;
        
      case 'point':
        // Suggestion 1: Basic scatter plot
        if (quantitativeFields.length >= 2) {
          suggestions.push({
            name: "Scatter Plot",
            description: "Two numeric variables compared",
            encoding: {
              x: { field: quantitativeFields[0], type: 'quantitative' },
              y: { field: quantitativeFields[1], type: 'quantitative' }
            }
          });
        }
        
        // Suggestion 2: Scatter plot with size
        if (quantitativeFields.length >= 3) {
          suggestions.push({
            name: "Bubble Chart",
            description: "Points sized by a third variable",
            encoding: {
              x: { field: quantitativeFields[0], type: 'quantitative' },
              y: { field: quantitativeFields[1], type: 'quantitative' },
              size: { field: quantitativeFields[2], type: 'quantitative' }
            }
          });
        }
        
        // Suggestion 3: Scatter plot with categories
        if (quantitativeFields.length >= 2 && categoricalFields.length) {
          suggestions.push({
            name: "Categorical Scatter Plot",
            description: "Points colored by category",
            encoding: {
              x: { field: quantitativeFields[0], type: 'quantitative' },
              y: { field: quantitativeFields[1], type: 'quantitative' },
              color: { field: categoricalFields[0], type: dataTypes[categoricalFields[0]] }
            }
          });
        }
        
        // Suggestion 4: Jittered dot plot for categorical data
        if (quantitativeFields.length && categoricalFields.length) {
          suggestions.push({
            name: "Dot Plot",
            description: "Distribution of values by category",
            encoding: {
              x: { field: categoricalFields[0], type: dataTypes[categoricalFields[0]] },
              y: { field: quantitativeFields[0], type: 'quantitative' },
              opacity: { value: 0.7 }
            }
          });
        }
        break;
        
      case 'arc':
        // Suggestion 1: Basic pie chart
        if (categoricalFields.length && quantitativeFields.length) {
          suggestions.push({
            name: "Pie Chart",
            description: "Simple category breakdown",
            encoding: {
              theta: { field: quantitativeFields[0], type: 'quantitative', aggregate: 'sum' },
              color: { field: categoricalFields[0], type: dataTypes[categoricalFields[0]] }
            }
          });
        }
        
        // Suggestion 2: Donut chart
        if (categoricalFields.length && quantitativeFields.length) {
          suggestions.push({
            name: "Donut Chart",
            description: "Pie chart with inner radius",
            encoding: {
              theta: { field: quantitativeFields[0], type: 'quantitative', aggregate: 'sum' },
              color: { field: categoricalFields[0], type: dataTypes[categoricalFields[0]] }
            }
          });
        }
        
        // Suggestion 3: Radial chart
        if (categoricalFields.length && quantitativeFields.length >= 2) {
          suggestions.push({
            name: "Radial Chart",
            description: "Categories with radius and angle",
            encoding: {
              theta: { field: quantitativeFields[0], type: 'quantitative', aggregate: 'sum' },
              radius: { field: quantitativeFields[1], type: 'quantitative', aggregate: 'mean' },
              color: { field: categoricalFields[0], type: dataTypes[categoricalFields[0]] }
            }
          });
        }
        break;
        
      case 'rect':
        // Suggestion 1: Basic heatmap
        if (categoricalFields.length >= 2 && quantitativeFields.length) {
          suggestions.push({
            name: "Category Heatmap",
            description: "Two categorical dimensions with color",
            encoding: {
              x: { field: categoricalFields[0], type: dataTypes[categoricalFields[0]] },
              y: { field: categoricalFields[1], type: dataTypes[categoricalFields[1]] },
              color: { field: quantitativeFields[0], type: 'quantitative', aggregate: 'mean' }
            }
          });
        }
        
        // Suggestion 2: Binned heatmap
        if (quantitativeFields.length >= 2) {
          suggestions.push({
            name: "Binned Heatmap",
            description: "Density of points in 2D space",
            encoding: {
              x: { field: quantitativeFields[0], type: 'quantitative', bin: true },
              y: { field: quantitativeFields[1], type: 'quantitative', bin: true },
              color: { aggregate: 'count', type: 'quantitative' }
            }
          });
        }
        
        // Suggestion 3: Calendar heatmap
        if (temporalFields.length && quantitativeFields.length) {
          suggestions.push({
            name: "Calendar Heatmap",
            description: "Values by day and month",
            encoding: {
              x: { field: temporalFields[0], type: 'temporal', timeUnit: 'date' },
              y: { field: temporalFields[0], type: 'temporal', timeUnit: 'month' },
              color: { field: quantitativeFields[0], type: 'quantitative', aggregate: 'mean' }
            }
          });
        }
        break;
        
      case 'boxplot':
        // Suggestion 1: Basic boxplot
        if (categoricalFields.length && quantitativeFields.length) {
          suggestions.push({
            name: "Basic Boxplot",
            description: "Distribution across categories",
            encoding: {
              x: { field: categoricalFields[0], type: dataTypes[categoricalFields[0]] },
              y: { field: quantitativeFields[0], type: 'quantitative' }
            }
          });
        }
        
        // Suggestion 2: Colored boxplot
        if (categoricalFields.length >= 2 && quantitativeFields.length) {
          suggestions.push({
            name: "Colored Boxplot",
            description: "Distribution with color grouping",
            encoding: {
              x: { field: categoricalFields[0], type: dataTypes[categoricalFields[0]] },
              y: { field: quantitativeFields[0], type: 'quantitative' },
              color: { field: categoricalFields[1], type: dataTypes[categoricalFields[1]] }
            }
          });
        }
        break;
        
      default:
        // Generate random variations as fallback
        for (let i = 0; i < 3; i++) {
          const randomEncoding = generateRandomEncoding(chartType, availableFields, dataTypes);
          suggestions.push({
            name: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Variation ${i + 1}`,
            description: getEncodingDescription(randomEncoding, chartType),
            encoding: randomEncoding
          });
        }
    }
    
    // If we couldn't create specific suggestions, use random as fallback
    if (suggestions.length === 0) {
      for (let i = 0; i < 4; i++) {
        const randomEncoding = generateRandomEncoding(chartType, availableFields, dataTypes);
        suggestions.push({
          name: `Random Variation ${i + 1}`,
          description: getEncodingDescription(randomEncoding, chartType),
          encoding: randomEncoding
        });
      }
    }
    
    return suggestions;
  };

  return (
    <EncodingSection>
      <EncodingTitle>
        Encoding
        <ButtonContainer>
          <Tooltip title="Apply intelligent encoding based on data characteristics">
            <StyledButton
              startIcon={<SmartToyIcon />}
              onClick={handleSmartEncodings}
              variant="outlined"
              size="small"
              disabled={availableFields.length === 0}
              color="primary"
            >
              Smart
            </StyledButton>
          </Tooltip>
          <Tooltip title="Explore random encoding variations">
            <StyledButton
              startIcon={<ShuffleIcon />}
              onClick={handleRandomizeEncodings}
              variant="outlined"
              size="small"
              disabled={availableFields.length === 0}
            >
              Random
            </StyledButton>
          </Tooltip>
        </ButtonContainer>
      </EncodingTitle>
      {children}
      
      {/* Encoding Suggestions Dialog */}
      <Dialog 
        open={showSuggestions} 
        onClose={() => setShowSuggestions(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {suggestionSource === 'smart' ? 'Smart Encoding Suggestions' : 'Random Encoding Variations'}
        </DialogTitle>
        <DialogContent>
          <p>Select one of the suggested encodings below:</p>
          <EncodingSuggestionGrid>
            {suggestedEncodings.map((suggestion, index) => (
              <EncodingSuggestionCard 
                key={index}
                onClick={() => applySuggestion(suggestion.encoding)}
              >
                <EncodingName>{suggestion.name}</EncodingName>
                <EncodingDescription>{suggestion.description}</EncodingDescription>
                <EncodingPreview>
                  {Object.entries(suggestion.encoding)
                    .filter(([channel]) => channel !== 'tooltip')
                    .map(([channel, enc]) => {
                      if (!enc) return null;
                      const encObj = Array.isArray(enc) ? enc[0] : enc;
                      if (!encObj?.field && !encObj?.aggregate) return null;
                      
                      // Build a more detailed description
                      let fieldPart = encObj.field || '';
                      let detailPart = '';
                      
                      // Show aggregation clearly
                      if (encObj.aggregate) {
                        if (encObj.field) {
                          fieldPart = `${encObj.aggregate}(${encObj.field})`;
                        } else {
                          fieldPart = `${encObj.aggregate}(*)`;
                        }
                      }
                      
                      // Add time unit if present
                      if (encObj.timeUnit) {
                        fieldPart = `${encObj.timeUnit}(${fieldPart})`;
                      }
                      
                      // Add bin information
                      if (encObj.bin) {
                        let binInfo = 'binned';
                        if (typeof encObj.bin === 'object') {
                          const binConfig = encObj.bin as BinConfig;
                          if (binConfig.maxbins) {
                            binInfo = `${binConfig.maxbins} bins`;
                          }
                        }
                        detailPart += ` [${binInfo}]`;
                      }
                      
                      // Add type
                      if (encObj.type) {
                        detailPart += ` (${encObj.type})`;
                      }
                      
                      return (
                        <div key={channel} style={{ marginBottom: '4px' }}>
                          <strong>{channel}:</strong> {fieldPart}{detailPart}
                        </div>
                      );
                    })}
                </EncodingPreview>
              </EncodingSuggestionCard>
            ))}
          </EncodingSuggestionGrid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuggestions(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </EncodingSection>
  );
};

export const EncodingField: React.FC<{
  label: string;
  field: string;
  type: string;
  aggregate?: string;
  timeUnit?: string;
  bin?: boolean | object;
  onChange: (field: string, type: string, options?: { aggregate?: string, timeUnit?: string, bin?: any }) => void;
  availableFields?: string[];
}> = ({ label, field, type, aggregate, timeUnit, bin, onChange, availableFields = [] }) => {
  // Handle the encoding options value
  const getOptionValue = () => {
    if (aggregate) return aggregate;
    if (timeUnit) return timeUnit;
    if (bin) {
      if (typeof bin === 'object' && 'maxbins' in bin) {
        return `bin-${bin.maxbins}`;
      }
      return 'bin';
    }
    return '';
  };

  // Handle changes to the encoding options
  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const options: { aggregate?: string, timeUnit?: string, bin?: any } = {};
    
    if (AGGREGATION_OPTIONS.some(opt => opt.value === value)) {
      options.aggregate = value;
    } else if (TIME_UNIT_OPTIONS.some(opt => opt.value === value)) {
      options.timeUnit = value;
    } else if (value === 'bin') {
      options.bin = true;
    } else if (value.startsWith('bin-')) {
      const binCount = parseInt(value.split('-')[1]);
      options.bin = { maxbins: binCount };
    }
    
    onChange(field, type, options);
  };
  
  return (
    <div>
      <EncodingRow>
        <EncodingLabel>{label}</EncodingLabel>
        <select 
          value={field} 
          onChange={(e) => onChange(e.target.value, type)}
        >
          <option value="">Select field</option>
          {availableFields.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <select 
          value={type} 
          onChange={(e) => onChange(field, e.target.value)}
        >
          <option value="quantitative">Quantitative</option>
          <option value="nominal">Nominal</option>
          <option value="ordinal">Ordinal</option>
          <option value="temporal">Temporal</option>
        </select>
      </EncodingRow>
      
      {field && (
        <EncodingOptionContainer>
          <EncodingOptionSelect
            value={getOptionValue()}
            onChange={handleOptionChange}
          >
            <option value="">No transformation</option>
            {type === 'quantitative' && (
              <>
                <optgroup label="Aggregation">
                  {AGGREGATION_OPTIONS.filter(opt => opt.value).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Binning">
                  {BINNING_OPTIONS.filter(opt => opt.value).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </optgroup>
              </>
            )}
            {type === 'temporal' && (
              <optgroup label="Time Unit">
                {TIME_UNIT_OPTIONS.filter(opt => opt.value).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            )}
          </EncodingOptionSelect>
        </EncodingOptionContainer>
      )}
    </div>
  );
};

// Helper function to safely check encoding type
const getEncodingType = (enc: EncodingDef | EncodingDef[] | undefined): string | undefined => {
  if (!enc) return undefined;
  if (Array.isArray(enc)) {
    return enc.length > 0 && enc[0].type ? enc[0].type : undefined;
  }
  return enc.type;
}; 