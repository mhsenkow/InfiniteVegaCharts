import styled from 'styled-components'
import { TopLevelSpec } from 'vega-lite'
import { useMemo, useState } from 'react'
import { EncodingChannel, MarkType, EncodingUpdate } from '../../types/vega'
import { sampleDatasets } from '../../utils/sampleData'
import { DatasetSelector } from './DatasetSelector'
import { generateRandomEncoding } from '../../utils/chartAdapters'

const Container = styled.div`
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`

const Section = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 8px;
`

const Control = styled.div`
  margin-bottom: 16px;
  &:last-child {
    margin-bottom: 0;
  }
`

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #495057;
  font-weight: 500;
`

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  color: #495057;
  transition: border-color 0.2s;

  &:hover {
    border-color: #adb5bd;
  }

  &:focus {
    border-color: #4dabf7;
    outline: none;
    box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.2);
  }
`

const EncodingGrid = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: center;
`

const EncodingControl = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`

const DatasetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 12px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 8px;

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
    
    &:hover {
      background: #bbb;
    }
  }
`

const DatasetCard = styled.button<{ $active: boolean; $disabled: boolean }>`
  padding: 12px;
  border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 6px;
  background: ${props => props.$active ? `${props.theme.colors.primary}10` : 'white'};
  text-align: left;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  
  &:hover {
    border-color: ${props => !props.$disabled && props.theme.colors.primary};
  }
`

const DatasetName = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`

const DatasetDescription = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.text.secondary};
`

const RandomizeButton = styled.button`
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  &:hover {
    background: #f8f9fa;
  }
`

interface VisualEditorProps {
  spec: TopLevelSpec;
  onChange: (updates: Partial<TopLevelSpec>) => void;
}

export const VisualEditor = ({ spec, onChange }: VisualEditorProps) => {
  const [currentDataset, setCurrentDataset] = useState(Object.keys(sampleDatasets)[0])
  const currentMark = typeof spec.mark === 'string' ? spec.mark : spec.mark?.type
  const [customDatasets, setCustomDatasets] = useState<Record<string, DatasetMetadata>>({});
  
  // Get current dataset from either custom or sample datasets
  const getCurrentDataset = () => {
    return customDatasets[currentDataset] || sampleDatasets[currentDataset];
  };

  const handleDatasetChange = (datasetId: string) => {
    const dataset = customDatasets[datasetId] || sampleDatasets[datasetId];
    if (!dataset) return;

    const shouldResetMark = currentMark && !dataset.compatibleCharts.includes(currentMark as MarkType);
    
    // Detect data types
    const dataTypes = detectDataTypes(dataset.values);
    
    // Determine best mark type if needed
    const markType = shouldResetMark ? dataset.compatibleCharts[0] : currentMark;
    
    // Get suggested encodings
    const suggestedEncodings = suggestEncodings(dataTypes, markType as MarkType);
    
    onChange({
      ...spec,
      data: { values: dataset.values },
      mark: markType,
      encoding: suggestedEncodings
    });
    
    setCurrentDataset(datasetId);
  }

  const handleMarkTypeChange = (type: MarkType) => {
    try {
      const dataset = sampleDatasets[currentDataset]
      if (!dataset.compatibleCharts.includes(type)) {
        return // Don't allow incompatible chart types
      }
      
      // When changing mark type, reset encodings to prevent invalid states
      onChange({ 
        ...spec,
        mark: type,
        encoding: {}
      })
    } catch (err) {
      console.error('Error updating mark type:', err)
    }
  }

  const handleEncodingChange = (channel: EncodingChannel, update: EncodingUpdate) => {
    try {
      onChange({
        encoding: {
          ...spec.encoding,
          [channel]: { ...spec.encoding?.[channel], ...update }
        }
      })
    } catch (err) {
      console.error('Error updating encoding:', err)
    }
  }

  const fields = useMemo(() => {
    try {
      if (spec.data?.values && Array.isArray(spec.data.values)) {
        const sampleRow = spec.data.values[0]
        return Object.keys(sampleRow || {})
      }
      return []
    } catch (err) {
      console.error('Error getting data fields:', err)
      return []
    }
  }, [spec.data?.values])

  const getAvailableEncodings = (): EncodingChannel[] => {
    try {
      const mark = typeof spec.mark === 'string' ? spec.mark : spec.mark?.type
      switch (mark) {
        case 'bar':
          return ['x', 'y', 'color', 'tooltip', 'order']
        case 'line':
          return ['x', 'y', 'color', 'strokeWidth', 'tooltip', 'order']
        case 'point':
          return ['x', 'y', 'size', 'color', 'tooltip', 'shape']
        case 'circle':
          return ['x', 'y', 'size', 'color', 'tooltip']
        case 'square':
          return ['x', 'y', 'size', 'color', 'tooltip']
        case 'arc':
          return ['theta', 'radius', 'color', 'tooltip']
        case 'area':
          return ['x', 'y', 'color', 'tooltip', 'order']
        case 'boxplot':
          return ['x', 'y', 'color', 'tooltip']
        case 'text':
          return ['x', 'y', 'text', 'color', 'size']
        case 'rect':
          return ['x', 'y', 'color', 'size', 'tooltip']
        case 'rule':
          return ['x', 'y', 'color', 'size', 'tooltip']
        case 'tick':
          return ['x', 'y', 'color', 'size', 'tooltip']
        case 'trail':
          return ['x', 'y', 'color', 'size', 'tooltip', 'order']
        default:
          return ['x', 'y', 'color', 'tooltip']
      }
    } catch (err) {
      console.error('Error getting available encodings:', err)
      return ['x', 'y']
    }
  }

  const detectDataTypes = (values: any[]): Record<string, string> => {
    if (!values.length) return {}
    
    const sampleRow = values[0]
    const types: Record<string, string> = {}
    
    Object.entries(sampleRow).forEach(([field, value]) => {
      if (typeof value === 'number') {
        types[field] = 'quantitative'
      } else if (value instanceof Date || !isNaN(Date.parse(value as string))) {
        types[field] = 'temporal'
      } else if (typeof value === 'string') {
        // Check if it's ordinal (numbers as strings) or nominal
        const isNumeric = !isNaN(Number(value))
        types[field] = isNumeric ? 'ordinal' : 'nominal'
      }
    })
    
    return types
  }

  const suggestEncodings = (dataTypes: Record<string, string>, markType: MarkType) => {
    const encodings: Record<string, any> = {}
    
    // Find fields by type
    const quantFields = Object.entries(dataTypes)
      .filter(([_, type]) => type === 'quantitative')
      .map(([field]) => field)
    
    const catFields = Object.entries(dataTypes)
      .filter(([_, type]) => type === 'nominal' || type === 'ordinal')
      .map(([field]) => field)
    
    const timeFields = Object.entries(dataTypes)
      .filter(([_, type]) => type === 'temporal')
      .map(([field]) => field)

    switch (markType) {
      case 'bar':
        if (catFields.length && quantFields.length) {
          encodings.x = { field: catFields[0], type: 'nominal' }
          encodings.y = { field: quantFields[0], type: 'quantitative' }
          if (catFields.length > 1) {
            encodings.color = { field: catFields[1], type: 'nominal' }
          }
        } else if (timeFields.length && quantFields.length) {
          encodings.x = { field: timeFields[0], type: 'temporal' }
          encodings.y = { field: quantFields[0], type: 'quantitative' }
        }
        break;

      case 'line':
        if (timeFields.length && quantFields.length) {
          encodings.x = { 
            field: timeFields[0], 
            type: 'temporal',
            scale: { zero: false }
          }
          encodings.y = { 
            field: quantFields[0], 
            type: 'quantitative',
            scale: { zero: false }
          }
          if (catFields.length) {
            encodings.color = { field: catFields[0], type: 'nominal' }
          }
          // Add stroke width encoding if there's an additional quantitative field
          if (quantFields.length > 1) {
            encodings.strokeWidth = { 
              field: quantFields[1], 
              type: 'quantitative',
              scale: { range: [0.5, 8] } // Customize the stroke width range
            }
          }
        } else if (quantFields.length >= 2) {
          encodings.x = { 
            field: quantFields[0], 
            type: 'quantitative',
            scale: { zero: false }
          }
          encodings.y = { 
            field: quantFields[1], 
            type: 'quantitative',
            scale: { zero: false }
          }
        }
        break;

      case 'point':
        if (quantFields.length >= 2) {
          encodings.x = { field: quantFields[0], type: 'quantitative' }
          encodings.y = { field: quantFields[1], type: 'quantitative' }
          if (catFields.length) {
            encodings.color = { field: catFields[0], type: 'nominal' }
          }
          if (quantFields.length > 2) {
            encodings.size = { field: quantFields[2], type: 'quantitative' }
          }
        }
        break;

      case 'circle':
      case 'square':
        if (quantFields.length >= 2) {
          encodings.x = { field: quantFields[0], type: 'quantitative' }
          encodings.y = { field: quantFields[1], type: 'quantitative' }
          if (catFields.length) {
            encodings.color = { field: catFields[0], type: 'nominal' }
          }
          // Add size encoding based on BMI
          encodings.size = { 
            field: 'bmi', 
            type: 'quantitative',
            scale: { range: [100, 1000] }
          }
        }
        break;

      case 'text':
        if (quantFields.length >= 2) {
          encodings.x = { field: quantFields[0], type: 'quantitative' }
          encodings.y = { field: quantFields[1], type: 'quantitative' }
          encodings.text = { field: 'bmi', type: 'quantitative' }
          if (catFields.length) {
            encodings.color = { field: catFields[0], type: 'nominal' }
          }
          // Add size encoding based on BMI
          encodings.size = { 
            field: 'bmi', 
            type: 'quantitative',
            scale: { range: [8, 20] }
          }
        }
        break;

      case 'rule':
        if (quantFields.length >= 2) {
          encodings.x = { field: quantFields[0], type: 'quantitative' }
          encodings.y = { field: quantFields[1], type: 'quantitative' }
          if (catFields.length) {
            encodings.color = { field: catFields[0], type: 'nominal' }
          }
        }
        break;

      case 'tick':
        if (quantFields.length) {
          encodings.x = { field: quantFields[0], type: 'quantitative' }
          if (catFields.length) {
            encodings.y = { field: catFields[0], type: 'nominal' }
            encodings.color = { field: catFields[0], type: 'nominal' }
          }
        }
        break;

      case 'trail':
        if (quantFields.length >= 2) {
          encodings.x = { field: quantFields[0], type: 'quantitative' }
          encodings.y = { field: quantFields[1], type: 'quantitative' }
          if (catFields.length) {
            encodings.color = { field: catFields[0], type: 'nominal' }
          }
          // Size encoding based on BMI
          encodings.size = { 
            field: 'bmi', 
            type: 'quantitative',
            scale: { range: [1, 8] }
          }
          // Order by height to create a trail effect
          encodings.order = { field: 'height', type: 'quantitative' }
        }
        break;
    }
    
    // Add tooltip for all chart types
    if (quantFields.length) {
      encodings.tooltip = [
        ...catFields.map(field => ({ field, type: 'nominal' })),
        ...quantFields.map(field => ({ field, type: 'quantitative' }))
      ]
    }
    
    return encodings
  }

  const handleRandomize = () => {
    const randomEncoding = generateRandomEncoding(fields)
    onChange({ encoding: randomEncoding })
  }

  if (!spec) {
    return <div>Invalid specification</div>
  }

  return (
    <Container>
      <Section>
        <SectionTitle>Dataset</SectionTitle>
        <DatasetSelector
          chartId={currentMark || ''}
          currentDataset={currentDataset}
          onSelect={handleDatasetChange}
          detectDataTypes={detectDataTypes}
          customDatasets={customDatasets}
          setCustomDatasets={setCustomDatasets}
        />
      </Section>

      <Section>
        <SectionTitle>Chart Type</SectionTitle>
        <Control>
          <Label>Mark Type</Label>
          <Select 
            value={currentMark || ''}
            onChange={(e) => handleMarkTypeChange(e.target.value as MarkType)}
          >
            {getCurrentDataset()?.compatibleCharts.map(chartType => (
              <option key={chartType} value={chartType}>
                {chartType.charAt(0).toUpperCase() + chartType.slice(1)}
              </option>
            ))}
          </Select>
        </Control>
      </Section>

      <Section>
        <SectionTitle>Encoding</SectionTitle>
        <RandomizeButton onClick={handleRandomize}>
          🎲 Randomize Encodings
        </RandomizeButton>
        {getAvailableEncodings().map(channel => (
          <Control key={channel}>
            <EncodingGrid>
              <Label>{channel.toUpperCase()}</Label>
              <EncodingControl>
                <Select
                  value={spec.encoding?.[channel]?.field || ''}
                  onChange={(e) => handleEncodingChange(channel, { field: e.target.value })}
                >
                  <option value="">Select field</option>
                  {fields.map(field => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </Select>
                <Select
                  value={spec.encoding?.[channel]?.type || ''}
                  onChange={(e) => handleEncodingChange(channel, { type: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option value="quantitative">Quantitative</option>
                  <option value="nominal">Nominal</option>
                  <option value="ordinal">Ordinal</option>
                  <option value="temporal">Temporal</option>
                </Select>
              </EncodingControl>
            </EncodingGrid>
          </Control>
        ))}
      </Section>
    </Container>
  )
} 