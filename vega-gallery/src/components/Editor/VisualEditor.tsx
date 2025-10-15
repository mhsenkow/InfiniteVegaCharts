import styled from 'styled-components'
import { TopLevelSpec } from 'vega-lite'
import { useMemo, useState, useRef, useEffect } from 'react'
import { EncodingChannel, MarkType, EncodingUpdate } from '../../types/vega'
import { sampleDatasets } from '../../utils/sampleData'
import { DatasetSelector } from './DatasetSelector'
import { generateRandomEncoding } from '../../utils/chartAdapters'
import { IconButton, Tooltip } from '@mui/material'
import TimelineIcon from '@mui/icons-material/Timeline'
import BarChartIcon from '@mui/icons-material/BarChart'
import CategoryIcon from '@mui/icons-material/Category'
import NumbersIcon from '@mui/icons-material/Numbers'
import { DatasetMetadata } from '../../types/dataset'
import Papa from 'papaparse'
import { DatasetSection } from './DatasetSection'
import { DataTransformerPanel } from './DataTransformerPanel'
import { markTypes } from '../../constants/markTypes'
import { inferDataTypes } from '../../utils/dataUtils'
import { getChartRecommendations } from '../../services/aiRecommendations'
import AutoGraphIcon from '@mui/icons-material/AutoGraph'
import RecommendIcon from '@mui/icons-material/Recommend'
import { detectDataTypes } from '../../utils/dataUtils'
import { initDB, getDataset } from '../../utils/indexedDB'
import { ExtendedSpec as VegaExtendedSpec } from '../../types/vega'
import { transformEncodings, createMarkConfig } from '../../utils/specUtils'
import { useDrop } from 'react-dnd'
import DataColumnToken, { ColumnMetadata, ColumnDragItem } from '../common/DataColumnToken'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`

const Section = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
`

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 1rem;
  color: var(--color-text-primary);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
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
  color: var(--color-text-primary);
  font-weight: 500;
`

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.9rem;
  background: var(--color-surface);
  color: var(--color-text-primary);
  transition: border-color 0.2s;
  position: relative;
  z-index: 10;
  cursor: pointer;

  &:hover {
    border-color: var(--color-text-tertiary);
  }

  &:focus {
    border-color: var(--color-primary);
    outline: none;
    box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.2);
    z-index: 20;
  }

  /* Ensure dropdown stays open */
  &:focus-within {
    z-index: 20;
  }

  /* Override any theme-specific pointer-events */
  option {
    background: var(--color-surface);
    color: var(--color-text-primary);
    padding: 8px 12px;
    border: none;
    cursor: pointer;
  }
`

const EncodingGrid = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
`

const EncodingControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const TypeButtons = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 4px;
  background: var(--color-background);
  border-radius: 4px;
`

const TypeButton = styled(IconButton)<{ $active: boolean }>`
  && {
    background: ${props => props.$active ? props.theme.colors.primary + '20' : 'transparent'};
    color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.text.secondary};
    border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
    padding: 4px;

    &:hover {
      background: ${props => props.$active ? props.theme.colors.primary + '30' : props.theme.colors.border + '40'};
    }
  }
`

const EncodingTypeButton = styled(IconButton)<{ $active: boolean; $compatible?: boolean }>`
  && {
    background: ${props => props.$active ? props.theme.colors.primary + '20' : 'transparent'};
    color: ${props => 
      props.$active ? props.theme.colors.primary : 
      props.$compatible !== false ? props.theme.colors.text.secondary :
      props.theme.colors.border};
    opacity: ${props => props.$compatible !== false ? 1 : 0.5};
    cursor: ${props => props.$compatible !== false ? 'pointer' : 'not-allowed'};
    padding: 4px;
    border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
    
    &:hover {
      background: ${props => props.$compatible !== false ? props.theme.colors.primary + '10' : 'transparent'};
    }
  }
`;

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
  background: ${props => props.$active ? `var(--color-primary)10` : 'white'};
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
  color: var(--color-text-secondary);
`

const RandomizeButton = styled.button`
  padding: 6px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;

  &:hover {
    background: var(--color-background);
  }
`

const TemplateButton = styled(RandomizeButton)`
  background: #fff8e1;
  border-color: #ffe082;
  
  &:hover {
    background: #ffecb3;
  }
`;

const EncodingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 8px;
`

const MarkTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
`

const MarkTypeCard = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: ${props => props.$active ? props.theme.colors.primary + '10' : '#fff'};
  border: 2px solid ${props => props.$active ? props.theme.colors.primary : '#e9ecef'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: var(--color-primary);
    background: ${props => props.theme.colors.primary + '05'};
  }
`

const MarkIcon = styled.div`
  font-size: 24px;
  margin-bottom: 8px;
`

const MarkName = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
`

const MarkTooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: var(--color-surface);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  width: max-content;
  max-width: 200px;
  visibility: hidden;
  opacity: 0;
  transition: all 0.2s;
  z-index: 1000;

  ul {
    margin: 4px 0 0 0;
    padding: 0 0 0 16px;
    list-style-type: none;
    
    li {
      margin: 2px 0;
      &:before {
        content: "•";
        margin-right: 4px;
      }
    }
  }

  ${MarkTypeCard}:hover & {
    visibility: visible;
    opacity: 1;
    bottom: calc(100% + 8px);
  }

  &:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.8);
  }
`

const MarkInfo = styled.div`
  text-align: center;
`

const MarkDescription = styled.div`
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-top: 4px;
`

const DatasetInfo = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: var(--color-background);
  border-radius: 4px;
  display: flex;
  gap: 16px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
`

const EncodingRow = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 12px;
  align-items: center;
`;

const EncodingLabel = styled.div`
  font-size: 0.9rem;
  color: var(--color-text-secondary);
`;

const EncodingTypeControls = styled.div`
  display: flex;
  gap: 4px;
`;

const EncodingHint = styled.div`
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-top: 4px;
`;

const EncodingPreview = styled.div`
  padding: 8px;
  background: var(--color-background);
  border-radius: 4px;
  margin-top: 8px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
`;

const Accordion = styled.div`
  margin-bottom: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;

  &:last-child {
    margin-bottom: 0;
  }
`;

const AccordionHeader = styled.button<{ $isOpen: boolean }>`
  width: 100%;
  padding: 16px;
  background: var(--color-background);
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  transition: background 0.2s;

  &:hover {
    background: var(--color-surfaceHover);
  }

  svg {
    transform: rotate(${props => props.$isOpen ? '180deg' : '0deg'});
    transition: transform 0.3s ease;
  }
`;

const AccordionContent = styled.div<{ $isOpen: boolean }>`
  padding: 0;
  height: ${props => props.$isOpen ? 'auto' : '0'};
  opacity: ${props => props.$isOpen ? '1' : '0'};
  overflow: hidden;
  transition: all 0.3s ease;
  
  > div {
    padding: 16px;
  }
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  background: var(--color-primary);
  color: var(--color-surface);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    opacity: 0.9;
  }
`;

const RecommendButton = styled(ActionButton)`
  background: #6366f1;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    font-size: 18px;
  }
`;

const RecommendationCard = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  text-align: left;
  background: ${props => props.$active ? '#f0f7ff' : 'white'};
  border: 1px solid ${props => props.$active ? '#4dabf7' : '#e9ecef'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-background);
  }
`;

const RecommendationTitle = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const RecommendationReason = styled.div`
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
`;

const ConfidenceBadge = styled.span<{ $confidence: number }>`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  background: ${props => {
    if (props.$confidence > 0.8) return '#d3f9d8';
    if (props.$confidence > 0.6) return '#fff3bf';
    return '#ffe3e3';
  }};
  color: ${props => {
    if (props.$confidence > 0.8) return '#2b8a3e';
    if (props.$confidence > 0.6) return '#e67700';
    return '#c92a2a';
  }};
`;

interface AccordionStates {
  data: boolean;
  filter: boolean;
  chartType: boolean;
  encoding: boolean;
}

interface DataTransform {
  type: 'filter' | 'calculate' | 'aggregate' | 'bin' | 'timeUnit';
  field?: string;
  as?: string;
  operation?: string;
  value?: any;
  test?: (d: any) => boolean;
}

interface ChartTemplate {
  name: string;
  icon: string;
  markType: MarkType;
  description: string;
  encodings: Record<string, any>;
  config?: Record<string, any>;
}

interface VisualEditorProps {
  spec: VegaExtendedSpec;
  onChange: (updates: Partial<VegaExtendedSpec>) => void;
  onChartRender?: () => void;
}

// Add mark-specific encoding definitions
const MARK_ENCODINGS: Record<MarkType, {
  channels: EncodingChannel[];
  description: string;
  hints: Record<string, string>;
  icon: string;
}> = {
  arc: {
    channels: ['theta', 'radius', 'color', 'opacity', 'tooltip', 'x', 'y'],
    description: 'Radial visualization - single pie or multiple pies in a grid',
    hints: {
      theta: 'Use quantitative values for angle (size of each slice)',
      radius: 'Optional: Use for hierarchical data or donut charts',
      color: 'Categories work well for segments',
      opacity: 'Optional: For emphasis or layering',
      x: 'Optional: Position multiple pie charts horizontally',
      y: 'Optional: Position multiple pie charts vertically'
    },
    icon: '🥧'
  },
  bar: {
    channels: ['x', 'y', 'color', 'size', 'tooltip', 'opacity'],
    description: 'Rectangular marks for comparisons',
    hints: {
      x: 'Categories or time for x-axis',
      y: 'Numbers work best for height',
      color: 'Optional: Use for grouping'
    },
    icon: '📊'
  },
  line: {
    channels: ['x', 'y', 'color', 'strokeWidth', 'opacity', 'order', 'tooltip'],
    description: 'Connected points showing trends over time',
    hints: {
      x: 'Time or ordered values',
      y: 'Numeric measurements',
      color: 'Use for multiple series'
    },
    icon: '📈'
  },
  point: {
    channels: ['x', 'y', 'color', 'size', 'shape', 'opacity', 'tooltip'],
    description: 'Individual marks for each data point',
    hints: {
      x: 'Any type of value',
      y: 'Any type of value',
      size: 'Optional: Use numbers for size'
    },
    icon: '🔵'
  },
  area: {
    channels: ['x', 'y', 'color', 'opacity', 'order', 'tooltip'],
    description: 'Filled areas between lines',
    hints: {
      x: 'Usually time or ordered values',
      y: 'Numeric values to fill to'
    },
    icon: '🟢'
  },
  boxplot: {
    channels: ['x', 'y', 'color', 'size', 'tooltip'],
    description: 'Statistical distribution with quartiles',
    hints: {
      x: 'Categories to group by',
      y: 'Numbers to show distribution'
    },
    icon: '📊'
  },
  errorbar: {
    channels: ['x', 'y', 'color', 'extent', 'tooltip'],
    description: 'Show uncertainty ranges',
    hints: {
      x: 'Categories or time',
      y: 'Numeric value with error margins'
    },
    icon: '🔴'
  },
  text: {
    channels: ['x', 'y', 'text', 'color', 'size', 'angle', 'tooltip'],
    description: 'Text labels on the chart',
    hints: {
      text: 'The text to display',
      angle: 'Optional: Rotate labels'
    },
    icon: '🔤'
  },
  // Add all other mark types...
  treemap: {
    channels: ['size', 'color', 'tooltip', 'label'],
    description: 'Hierarchical data as nested rectangles',
    hints: {
      size: 'Numeric value for rectangle size',
      color: 'Categories or numbers for color'
    },
    icon: '🟠'
  },
  sunburst: {
    channels: ['theta', 'radius', 'color', 'tooltip'],
    description: 'Hierarchical data in radial layout',
    hints: {
      theta: 'Angle for segment size',
      radius: 'Level in hierarchy'
    },
    icon: '🟡'
  },
  'parallel-coordinates': {
    channels: ['dimensions', 'color', 'detail', 'opacity', 'tooltip', 'order'],
    description: 'Show multidimensional data with lines across parallel axes',
    hints: {
      dimensions: 'Numeric fields to show as parallel axes',
      color: 'Category to color lines by',
      detail: 'Field to separate lines by (usually ID)',
      order: 'Order of the dimensions',
      opacity: 'Useful to manage overlapping lines'
    },
    icon: '📊'
  }
};

// Helper functions should be at the top, before the component
const getCompatibleTypes = (field: string, values: any[]): string[] => {
  if (!values.length || !values[0]?.[field]) return ['nominal'];
  
  const sampleValue = values[0][field];
  const allValues = values.map(v => v[field]).filter(v => v != null);
  
  const types = [];
  
  // Check for quantitative
  if (allValues.every(v => typeof v === 'number' && isFinite(v))) {
    types.push('quantitative');
  }
  
  // Check for temporal
  if (allValues.every(v => !isNaN(Date.parse(String(v))))) {
    types.push('temporal');
  }
  
  // Check for ordinal
  const uniqueValues = new Set(allValues);
  if (uniqueValues.size <= 20) {
    types.push('ordinal');
  }
  
  // Always allow nominal
  types.push('nominal');
  
  return types;
};

const getDefaultEncoding = (channel: string, field: string, type: string = 'quantitative') => {
  return {
    field,
    type,
    ...(type === 'quantitative' ? { scale: { zero: true } } : {})
  };
};

// Add safe type checking for mark type
const getMarkType = (spec: any): MarkType => {
  if (!spec) return 'point';
  if (typeof spec.mark === 'string') return spec.mark as MarkType;
  if (typeof spec.mark?.type === 'string') return spec.mark.type as MarkType;
  return 'point';
};

// Add the following styled components for tabs 
const DataTabsContainer = styled.div`
  display: flex;
  gap: 2px;
  margin-bottom: 16px;
  background: var(--color-background);
  border-radius: 6px;
  padding: 4px;
  overflow-x: auto;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
`

const DataTab = styled.button<{ $active: boolean }>`
  padding: 8px 12px;
  background: ${(props: any) => props.$active ? 'var(--color-surface)' : 'transparent'};
  color: ${(props: any) => props.$active ? 'var(--color-primary)' : 'var(--color-text-secondary)'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: ${(props: any) => props.$active ? '600' : '500'};
  font-size: 0.9rem;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: ${(props: any) => props.$active ? 'var(--color-surface)' : 'var(--color-surfaceHover)'};
    color: ${(props: any) => props.$active ? 'var(--color-primary)' : 'var(--color-text-primary)'};
  }
`;

const TabContent = styled.div`
  background: var(--color-surface);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--color-border);
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

// Add this type for data subsection tabs
type DataTabSection = 'dataset' | 'filter' | 'chartType' | 'encoding';

// Add these new constants for encoding options
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

const EncodingOptionSelect = styled.select`
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.8rem;
  margin-top: 4px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  position: relative;
  z-index: 15;
  cursor: pointer;

  &:focus {
    border-color: var(--color-primary);
    outline: none;
    box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.2);
    z-index: 25;
  }

  &:focus-within {
    z-index: 25;
  }

  option {
    background: var(--color-surface);
    color: var(--color-text-primary);
    padding: 4px 8px;
    border: none;
    cursor: pointer;
  }
`;

// Add droppable encoding control
const DroppableEncodingControl = styled.div<{ $isOver?: boolean; $canDrop?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  border: 2px dashed ${props => 
    props.$isOver 
      ? props.$canDrop 
        ? 'var(--color-success, #4caf50)' 
        : 'var(--color-error, #f44336)' 
      : 'var(--color-border)'};
  background: ${props => 
    props.$isOver 
      ? props.$canDrop 
        ? 'rgba(76, 175, 80, 0.08)' 
        : 'rgba(244, 67, 54, 0.08)' 
      : 'var(--color-surface)'};
  transition: all 0.2s ease;
  position: relative;
  overflow: visible; /* Changed from hidden to visible */
  
  &:hover {
    border-color: var(--color-primary);
    background: ${props => !props.$isOver && 'rgba(33, 150, 243, 0.04)'};
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => 
      props.$isOver && props.$canDrop 
        ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(76, 175, 80, 0.05) 10px, rgba(76, 175, 80, 0.05) 20px)' 
        : 'none'};
    pointer-events: none;
    opacity: ${props => props.$isOver ? 1 : 0};
    transition: opacity 0.3s;
    z-index: 0; /* Ensure this stays behind select elements */
  }

  /* Ensure select elements are always on top */
  select {
    position: relative;
    z-index: 15 !important;
  }
`;

const ColumnTokenContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
`;

const DropHint = styled.div`
  padding: 12px;
  color: var(--color-text-secondary);
  text-align: center;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
`;

const DragIcon = styled.div`
  opacity: 0.5;
  font-size: 1.2rem;
  margin-bottom: 4px;
`;

// Add these styled components at the top level with other styled definitions
const ColumnTypeSection = styled.div`
  margin-bottom: 16px;
`;

const ColumnTypeHeading = styled.h4`
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AvailableColumnsContainer = styled.div`
  padding: 16px;
  background: var(--color-background);
  border-radius: 8px;
  margin-bottom: 24px;
`;

export const VisualEditor = ({ spec, onChange, onChartRender }: VisualEditorProps) => {
  // Add state for dataset cache
  const [datasetCache, setDatasetCache] = useState<Record<string, DatasetMetadata>>({});
  const [currentDataset, setCurrentDataset] = useState<string | null>(null);
  const [customDatasets, setCustomDatasets] = useState<Record<string, DatasetMetadata>>({});
  const [filterField, setFilterField] = useState('');
  const [filterType, setFilterType] = useState('equals');
  const [filterValue, setFilterValue] = useState('');
  const [currentMark, setCurrentMark] = useState<MarkType>(() => {
    try {
      if (typeof spec === 'string') {
        const parsed = JSON.parse(spec);
        return typeof parsed.mark === 'string' ? parsed.mark : parsed.mark?.type || 'point';
      }
      return typeof spec.mark === 'string' ? spec.mark : spec.mark?.type || 'point';
    } catch (e) {
      console.error('Failed to parse spec:', e);
      return 'point';
    }
  });
  const [encodings, setEncodings] = useState(() => {
    try {
      if (typeof spec === 'string') {
        const parsed = JSON.parse(spec);
        return parsed.encoding || {};
      }
      return spec.encoding || {};
    } catch (e) {
      console.error('Failed to parse spec:', e);
      return {};
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const loadSavedStates = (): AccordionStates => {
    const saved = localStorage.getItem('visualEditorAccordionStates');
    return saved ? JSON.parse(saved) : {
      data: true,
      filter: false,
      chartType: true,
      encoding: true
    };
  };

  const [accordionStates, setAccordionStates] = useState<AccordionStates>(loadSavedStates());

  useEffect(() => {
    localStorage.setItem('visualEditorAccordionStates', JSON.stringify(accordionStates));
  }, [accordionStates]);

  const toggleAccordion = (section: keyof AccordionStates) => {
    setAccordionStates((prev: AccordionStates) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get current dataset from either custom or sample datasets
  const getCurrentDataset = () => {
    return customDatasets[currentDataset] || sampleDatasets[currentDataset];
  };

  const validateData = (data: any[]): any[] => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(row => {
      if (!row || typeof row !== 'object') return false;
      // Filter out rows with invalid values
      return Object.values(row).every(value => 
        value === null || 
        value === undefined || 
        typeof value === 'string' ||
        typeof value === 'number' ||
        value instanceof Date
      );
    });
  };

  // Handle dataset upload from DatasetSection
  const handleDataUpload = (data: any[]) => {
    const validData = validateData(data);
    // Create a new dataset entry
    const newDataset: DatasetMetadata = {
      id: `upload-${Date.now()}`,
      name: `Uploaded Dataset ${Object.keys(customDatasets).length + 1}`,
      description: `Dataset with ${validData.length} rows and ${Object.keys(validData[0] || {}).length} columns`,
      values: validData,
      source: 'upload',
      uploadDate: new Date(),
      dataTypes: detectDataTypes(validData)
    };

    setCustomDatasets(prev => ({
      ...prev,
      [newDataset.id]: newDataset
    }));

    setCurrentDataset(newDataset.id);

    // Update the chart with the new data and default mark type
    onChange({
      data: { values: validData },
      mark: 'point', // Set a default mark type
      encoding: {
        x: { 
          field: Object.keys(validData[0])[0], 
          type: 'quantitative'
        },
        y: { 
          field: Object.keys(validData[0])[1], 
          type: 'quantitative'
        }
      }
    });
  };

  // Handle dataset selection
  const handleDatasetSelect = async (datasetId: string | DatasetMetadata) => {
    try {
      let dataset;

      // If it's a string ID, try to get from sample datasets first
      if (typeof datasetId === 'string') {
        if (sampleDatasets[datasetId]) {
          dataset = {
            id: datasetId,
            ...sampleDatasets[datasetId]
          };
        } else {
          // Try to get from IndexedDB
          dataset = await getDataset(datasetId);
        }
      } else {
        // It's already a dataset object
        dataset = datasetId;
      }

      if (!dataset || !dataset.values) {
        console.error('Dataset not found or invalid:', datasetId);
        return;
      }

      // Set current dataset ID
      setCurrentDataset(typeof datasetId === 'string' ? datasetId : dataset.id);

      // Create Vega-Lite spec with the dataset
      const newSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        description: dataset.description || '',
        data: {
          values: dataset.values
        },
        mark: currentMark || 'area',
        encoding: {
          x: {
            field: dataset.columns?.[0] || Object.keys(dataset.values[0])[0],
            type: dataset.dataTypes?.[dataset.columns?.[0]] || 'nominal'
          },
          y: {
            field: dataset.columns?.find(col => dataset.dataTypes?.[col] === 'quantitative') 
              || Object.keys(dataset.values[0])[1],
            type: 'quantitative'
          }
        }
      };

      onChange(newSpec);

    } catch (error) {
      console.error('Failed to load dataset:', error);
    }
  };

  const handleMarkTypeChange = (newMarkType: MarkType) => {
    setCurrentMark(newMarkType);

    // Get available encodings for the new mark type
    const availableEncodings = MARK_ENCODINGS[newMarkType].channels;

    // Filter out incompatible encodings and keep compatible ones
    const updatedEncodings = Object.entries(spec.encoding || {}).reduce((acc, [channel, encoding]) => {
      if (availableEncodings.includes(channel as EncodingChannel)) {
        acc[channel] = encoding;
      }
      return acc;
    }, {});

    // Define default mark configurations based on type
    const getDefaultMarkConfig = (type: MarkType) => {
      const baseConfig = {
        type,
        tooltip: true
      };

      switch (type) {
        case 'point':
        case 'circle':
          return {
            ...baseConfig,
            filled: true,
            size: 100,
            opacity: 0.7
          };
        case 'bar':
          return {
            ...baseConfig,
            cornerRadius: 0,
            opacity: 0.8
          };
        case 'line':
          return {
            ...baseConfig,
            point: true,
            strokeWidth: 2,
            interpolate: 'linear'
          };
        case 'area':
          return {
            ...baseConfig,
            opacity: 0.6,
            line: true
          };
        case 'text':
          return {
            ...baseConfig,
            fontSize: 11,
            fontWeight: 400
          };
        default:
          return baseConfig;
      }
    };

    // Update the spec with new mark type and filtered encodings
    onChange({
      ...spec,
      mark: getDefaultMarkConfig(newMarkType),
      encoding: {
        ...updatedEncodings,
        // Ensure size encoding is handled properly
        ...(spec.encoding?.size && {
          size: {
            ...spec.encoding.size,
            scale: { type: 'linear', range: [50, 1000] }
          }
        })
      },
      config: {
        ...spec.config,
        mark: {
          ...spec.config?.mark,
          invalid: 'filter'
        }
      }
    });
  };

  const handleEncodingChange = (channel: string, update: EncodingUpdate) => {
    const currentEncoding = encodings[channel] || {};
    const newEncoding = {
      ...currentEncoding,
      ...update
    };

    // Remove properties with empty string values
    Object.keys(newEncoding).forEach(key => {
      if (newEncoding[key] === '') {
        delete newEncoding[key];
      }
    });

    // Handle bin specially since it can be boolean or object
    if (update.bin === '') {
      delete newEncoding.bin;
    } else if (typeof update.bin === 'string' && update.bin.startsWith('bin-')) {
      const binCount = parseInt(update.bin.split('-')[1]);
      newEncoding.bin = { maxbins: binCount };
    }

    const updatedEncodings = {
      ...encodings,
      [channel]: newEncoding
    };

    setEncodings(updatedEncodings);
    onChange({ ...spec, encoding: updatedEncodings });
  };

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
    return MARK_ENCODINGS[currentMark]?.channels || [];
  }

  const suggestEncodings = () => {
    const data = spec.data?.values || [];
    if (!data.length) return;

    const dataTypes = inferDataTypes(data);
    const suggestions: Record<string, any> = {};

    // Find temporal field for x-axis
    const temporalField = Object.entries(dataTypes)
      .find(([_, types]) => types.includes('temporal'))?.[0];
    if (temporalField) {
      suggestions.x = { field: temporalField, type: 'temporal' };
    }

    // Find quantitative field for y-axis
    const quantField = Object.entries(dataTypes)
      .find(([_, types]) => types.includes('quantitative'))?.[0];
    if (quantField) {
      suggestions.y = { field: quantField, type: 'quantitative' };
    }

    // Find categorical field for color
    const nominalField = Object.entries(dataTypes)
      .find(([_, types]) => types.includes('nominal'))?.[0];
    if (nominalField) {
      suggestions.color = { field: nominalField, type: 'nominal' };
    }

    return suggestions;
  };

  const handleRandomizeEncodings = () => {
    const markConfig = MARK_ENCODINGS[currentMark];
    const newEncodings = {};
    
    markConfig.channels.forEach(channel => {
      const compatibleFields = fields.filter(field => {
        switch (channel) {
          case 'theta':
          case 'radius':
          case 'size':
            return fieldTypes[field] === 'quantitative';
          case 'color':
            return fieldTypes[field] === 'nominal';
          case 'x':
          case 'y':
            return true; // Accept any type
          default:
            return true;
        }
      });
      
      if (compatibleFields.length) {
        const randomField = compatibleFields[
          Math.floor(Math.random() * compatibleFields.length)
        ];
        
        const fieldType = fieldTypes[randomField];
        const encoding = {
          field: randomField,
          type: fieldType
        };
        
        // Add suggested encoding options
        const suggestion = suggestEncodingOption(randomField, channel, fieldType);
        if (suggestion) {
          if (fieldType === 'quantitative') {
            if (suggestion === 'bin') {
              encoding.bin = true;
            } else {
              encoding.aggregate = suggestion;
            }
          } else if (fieldType === 'temporal') {
            encoding.timeUnit = suggestion;
          }
        }
        
        newEncodings[channel] = encoding;
      }
    });
    
    setEncodings(newEncodings);
    onChange({ ...spec, encoding: newEncodings });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Parse CSV file
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        // Update the spec with the new data
        onChange({
          data: { values: results.data },
          // Reset encodings when new data is loaded
          encoding: {
            x: { field: Object.keys(results.data[0])[0], type: 'quantitative' },
            y: { field: Object.keys(results.data[0])[1], type: 'quantitative' }
          }
        });

        // Create dataset metadata
        const dataset: DatasetMetadata = {
          id: file.name,
          name: file.name.split('.')[0],
          description: `Uploaded ${file.name}`,
          values: results.data,
          uploadDate: new Date(),
          source: 'upload'
        };

        // You can pass this to a parent component if needed
        console.log('Dataset loaded:', dataset);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
      }
    });
  };

  // Type guard for data values
  const getDataValues = () => {
    if ('values' in spec.data) {
      return spec.data.values;
    }
    return null;
  };

  const handleFieldSelect = (channel: string, field: string) => {
    const compatibleTypes = getCompatibleTypes(field, spec.data?.values || []);
    
    // Choose best default type based on channel and data
    let defaultType = 'nominal';
    if (channel === 'y' && compatibleTypes.includes('quantitative')) {
      defaultType = 'quantitative';
    } else if (channel === 'x' && compatibleTypes.includes('temporal')) {
      defaultType = 'temporal';
    } else if (channel === 'size' && compatibleTypes.includes('quantitative')) {
      defaultType = 'quantitative';
    } else if (compatibleTypes.includes('nominal')) {
      defaultType = 'nominal';
    }

    handleEncodingChange(channel, { 
      field,
      type: defaultType
    });
  };

  const [transforms, setTransforms] = useState<DataTransform[]>([]);
  const [activeTransform, setActiveTransform] = useState<DataTransform | null>(null);

  const applyTransforms = (data: any[]) => {
    return transforms.reduce((result, transform) => {
      switch (transform.type) {
        case 'filter':
          return result.filter(row => {
            if (!row[transform.field]) return false;
            const value = row[transform.field];
            switch (transform.operation) {
              case 'equals':
                return String(value) === transform.value;
              case 'contains':
                return String(value).toLowerCase().includes(String(transform.value).toLowerCase());
              case 'greater':
                return !isNaN(Number(value)) && Number(value) > Number(transform.value);
              case 'less':
                return !isNaN(Number(value)) && Number(value) < Number(transform.value);
              default:
                return true;
            }
          });

        case 'calculate':
          return result.map(row => {
            try {
              return {
                ...row,
                [transform.as]: transform.test?.(row)
              };
            } catch (e) {
              return row;
            }
          });

        case 'aggregate':
          try {
            const groups = {};
            result.forEach(row => {
              const key = row[transform.field];
              if (key != null) {  // Skip null/undefined values
                if (!groups[key]) groups[key] = [];
                groups[key].push(row);
              }
            });
            return Object.entries(groups).map(([key, values]) => ({
              [transform.field]: key,
              [transform.as]: aggregateValues(values, transform.operation)
            }));
          } catch (e) {
            console.warn('Aggregation failed:', e);
            return result;
          }

        default:
          return result;
      }
    }, data.filter(row => row != null)); // Filter out null/undefined rows
  };

  const applyFilter = () => {
    if (!filterField || !filterValue) return;

    const newTransform: DataTransform = {
      type: 'filter',
      field: filterField,
      operation: filterType,
      value: filterValue
    };

    setTransforms(prev => [...prev, newTransform]);
    
    if (spec.data?.values) {
      const filteredData = applyTransforms([...spec.data.values]);
      onChange({
        ...spec,
        data: { values: filteredData }
      });
    }
  };

  const aggregateValues = (values: any[], operation: string) => {
    const nums = values
      .map(v => Number(v))
      .filter(n => !isNaN(n) && isFinite(n)); // Filter out NaN and Infinity

    if (nums.length === 0) return 0;

    switch (operation) {
      case 'sum':
        return nums.reduce((a, b) => a + b, 0);
      case 'mean':
        return nums.reduce((a, b) => a + b, 0) / nums.length;
      case 'min':
        return Math.min(...nums);
      case 'max':
        return Math.max(...nums);
      default:
        return values.length; // count
    }
  };

  const [recommendations, setRecommendations] = useState([]);

  const handleRecommendEncodings = () => {
    if (!spec.data?.values?.length) return;

    // Get clean data and correct data types for better recommendations
    const dataValues = spec.data.values;
    const dataTypes = inferDataTypes(dataValues);
    
    // Create a properly formatted dataset for recommendations
    const dataset = {
      values: dataValues,
      dataTypes: Object.entries(dataTypes).reduce((acc, [field, types]) => {
        // Choose the most appropriate type from the inferred types
        acc[field] = types[0]; // Take the first inferred type
        return acc;
      }, {})
    };

    console.log('Getting recommendations for dataset:', dataset);
    const recs = getChartRecommendations(dataset);
    console.log('Received recommendations:', recs);
    setRecommendations(recs);
  };

  const applyRecommendation = (recommendation) => {
    // Add debug log
    console.log('Applying recommendation:', recommendation);
    
    // Update the current mark type
    setCurrentMark(recommendation.chartType);
    
    // Process the encodings using our utility function
    const newEncodings = transformEncodings(recommendation.suggestedEncodings);
    
    // Update encodings state
    setEncodings(newEncodings);
    
    // Create a new spec object with the new mark type and encodings
    const newSpec = {
      ...spec,
      mark: createMarkConfig(recommendation.chartType),
      encoding: newEncodings
    };

    // Apply the changes
    onChange(newSpec);
    
    // Force a complete re-render immediately 
    if (onChartRender) {
      onChartRender();
    }
    
    // Apply a second update after a short delay to ensure the chart refreshes properly
    setTimeout(() => {
      // Create a slightly modified copy of the spec to force a re-render
      const refreshedSpec = {
        ...newSpec,
        width: newSpec.width || undefined, // Trigger width recalculation
        height: newSpec.height || undefined, // Trigger height recalculation
        // Add a renderKey to force Vega-Lite to create a new View
        config: {
          ...(newSpec.config || {}),
          _renderKey: Date.now() // Add a unique render key
        }
      };
      onChange(refreshedSpec);
      
      // Notify parent to update chart render key
      if (onChartRender) {
        onChartRender();
      }
    }, 50);
  };

  // Detect field types
  const fieldTypes = fields.reduce((acc, field) => {
    const value = spec.data?.values?.[0]?.[field];
    acc[field] = typeof value === 'number' ? 'quantitative' : 
                 value instanceof Date ? 'temporal' : 'nominal';
    return acc;
  }, {} as Record<string, string>);

  // Safe spec parsing
  const parsedSpec = useMemo(() => {
    try {
      return typeof spec === 'string' ? JSON.parse(spec) : spec;
    } catch (e) {
      console.error('Failed to parse spec:', e);
      return {
        mark: { type: 'point' },
        encoding: {},
        data: { values: [] }
      };
    }
  }, [spec]);

  // Safe mark type access
  const markType = useMemo(() => {
    if (!parsedSpec) return 'point';
    if (typeof parsedSpec.mark === 'string') return parsedSpec.mark;
    return parsedSpec.mark?.type || 'point';
  }, [parsedSpec]);

  const [templates, setTemplates] = useState<ChartTemplate[]>(CHART_TEMPLATES);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleApplyTemplate = (template: ChartTemplate) => {
    // Update mark type
    setCurrentMark(template.markType);
    
    // Find fields that match the required types for the template
    const dataValues = spec.data?.values || [];
    if (!dataValues.length) return;
    
    const dataTypes = inferDataTypes(dataValues);
    const fieldsByType = Object.entries(dataTypes).reduce((acc, [field, types]) => {
      types.forEach(type => {
        if (!acc[type]) acc[type] = [];
        acc[type].push(field);
      });
      return acc;
    }, {} as Record<string, string[]>);
    
    // Map template encodings to actual fields
    const newEncodings = Object.entries(template.encodings).reduce((acc, [channel, config]) => {
      const requiredType = config.type;
      const fields = fieldsByType[requiredType] || [];
      
      if (fields.length > 0) {
        // Choose different fields for different channels if possible
        const availableFields = fields.filter(field => 
          !Object.values(acc).some(enc => enc.field === field)
        );
        
        const fieldToUse = availableFields.length > 0 ? availableFields[0] : fields[0];
        
        acc[channel] = {
          field: fieldToUse,
          type: requiredType,
          ...(config.bin && { bin: config.bin }),
          ...(config.aggregate && { aggregate: config.aggregate }),
          ...(config.timeUnit && { timeUnit: config.timeUnit })
        };
      }
      
      return acc;
    }, {});
    
    // Create mark configuration
    const markConfig = typeof template.config === 'object' ? 
      { type: template.markType, ...template.config } : 
      template.markType;
    
    // Update encodings state
    setEncodings(newEncodings);
    
    // Update the spec
    const newSpec = {
      ...spec,
      mark: markConfig,
      encoding: newEncodings
    };
    
    // Apply the changes
    onChange(newSpec);
    
    // Force chart re-render
    if (onChartRender) {
      onChartRender();
    }
    
    // Hide templates panel
    setShowTemplates(false);
  };

  // Add this state for data tabs
  const [activeDataTab, setActiveDataTab] = useState<DataTabSection>('dataset');

  // Add helper to get appropriate encoding options based on field type
  const getEncodingOptions = (channel: string, fieldType: string) => {
    if (fieldType === 'quantitative') {
      return AGGREGATION_OPTIONS.concat(BINNING_OPTIONS);
    } else if (fieldType === 'temporal') {
      return TIME_UNIT_OPTIONS;
    }
    return [];
  };

  // Add helper to detect if a field would benefit from aggregation
  const suggestEncodingOption = (field: string, channel: string, fieldType: string) => {
    if (!field || !spec.data?.values) return '';
    
    // Get data for field
    const values = spec.data.values.map(d => d[field]).filter(v => v !== undefined && v !== null);
    
    if (fieldType === 'quantitative') {
      const uniqueCount = new Set(values).size;
      const totalCount = values.length;
      
      // If there are many unique values and channel is y, suggest sum or mean
      if (uniqueCount > 20 && channel === 'y') {
        return 'mean';
      }
      
      // If there are many values but few uniques, suggest binning
      if (uniqueCount < totalCount * 0.1 && uniqueCount > 10) {
        return 'bin';
      }
    } else if (fieldType === 'temporal') {
      // For date fields, suggest appropriate time unit
      const dates = values.map(v => new Date(v));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      const daysDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 365 * 2) return 'year';
      if (daysDiff > 90) return 'month';
      if (daysDiff > 30) return 'week';
      if (daysDiff > 2) return 'day';
      
      return 'hour';
    }
    
    return '';
  };

  const [columnMetadata, setColumnMetadata] = useState<Record<string, ColumnMetadata>>({});

  // Internal implementation of the suggestEncodingChannel function
  const suggestEncodingChannel = (column: ColumnMetadata): string | null => {
    switch(column.type) {
      case "quantitative":
        return "y";
      case "temporal":
        return "x";
      case "nominal":
      case "ordinal":
        return "color";
      default:
        return null;
    }
  };

  // Update to calculate column metadata when data changes
  useEffect(() => {
    const values = getDataValues();
    if (!values || values.length === 0) return;
    
    const dataTypes = detectDataTypes(values);
    const metadata: Record<string, ColumnMetadata> = {};
    
    // Extract columns from the first row of data
    Object.keys(values[0] || {}).forEach(column => {
      // Get column values for statistics
      const columnValues = values
        .map(row => row[column])
        .filter(val => val !== null && val !== undefined);
        
      const uniqueValues = new Set(columnValues).size;
      const missingValues = values.length - columnValues.length;
      
      // Calculate basic statistics for numerical columns
      let stats = undefined;
      if (dataTypes[column] === 'quantitative') {
        const numericValues = columnValues.map(v => Number(v)).filter(v => !isNaN(v));
        if (numericValues.length > 0) {
          const min = Math.min(...numericValues);
          const max = Math.max(...numericValues);
          const sum = numericValues.reduce((a, b) => a + b, 0);
          const mean = sum / numericValues.length;
          
          stats = { min, max, mean };
        }
      }
      
      metadata[column] = {
        name: column,
        type: dataTypes[column] || 'nominal',
        uniqueValues,
        missingValues,
        stats
      };
    });
    
    setColumnMetadata(metadata);
  }, [spec.data]);

  // Handler for field drop on encoding
  const handleColumnDrop = (channel: string, column: ColumnMetadata) => {
    const newEncodings = {
      ...encodings,
      [channel]: {
        field: column.name,
        type: column.type,
      }
    };
    
    setEncodings(newEncodings);
    onChange({ ...spec, encoding: newEncodings } as VegaExtendedSpec);
  };

  // Create droppable encoding component
  const EncodingDropTarget = ({ channel }: { channel: string }) => {
    const [{ isOver, canDrop }, drop] = useDrop({
      accept: 'column',
      drop: (item: ColumnDragItem) => {
        handleColumnDrop(channel, item.column);
        return { channel };
      },
      canDrop: (item: ColumnDragItem) => {
        // You can add logic here to determine if a column can be dropped on this encoding
        return true;
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
      }),
      // Prevent drag/drop from interfering with select elements
      hover: (item, monitor) => {
        // Don't trigger hover effects when over select elements
        const targetElement = monitor.getDropResult()?.targetElement;
        if (targetElement && (targetElement.tagName === 'SELECT' || targetElement.tagName === 'OPTION')) {
          return;
        }
      }
    });

    // Handle dropdown open/close states to prevent theme interference
    const handleSelectFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      console.log('SELECT FOCUS - Adding dropdown-open class');
      // Add class to body to disable theme effects
      document.body.classList.add('dropdown-open');
      
      // Force the select to stay focused
      const selectElement = e.target;
      selectElement.style.zIndex = '999999';
      selectElement.style.position = 'relative';
      
      // Prevent event bubbling
      e.stopPropagation();
      e.preventDefault();
    };

    const handleSelectBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      console.log('SELECT BLUR - Removing dropdown-open class');
      
      // Delay removal to allow for option selection
      setTimeout(() => {
        document.body.classList.remove('dropdown-open');
      }, 150);
      
      // Prevent event bubbling
      e.stopPropagation();
    };

    const handleSelectMouseDown = (e: React.MouseEvent<HTMLSelectElement>) => {
      console.log('SELECT MOUSEDOWN - Preventing interference');
      // Prevent any interference from parent components
      e.stopPropagation();
      
      // Force focus
      const selectElement = e.target as HTMLSelectElement;
      setTimeout(() => {
        selectElement.focus();
      }, 0);
    };

    const handleSelectClick = (e: React.MouseEvent<HTMLSelectElement>) => {
      console.log('SELECT CLICK - Ensuring dropdown opens');
      // Prevent event bubbling that might close the dropdown
      e.stopPropagation();
      
      // Ensure the dropdown opens
      const selectElement = e.target as HTMLSelectElement;
      selectElement.style.zIndex = '999999';
      
      // Force open the dropdown
      if (!selectElement.matches(':focus')) {
        selectElement.focus();
      }
    };

    return (
      <DroppableEncodingControl ref={drop} $isOver={isOver} $canDrop={canDrop}>
        {encodings[channel]?.field ? (
          <ColumnTokenContainer>
            {columnMetadata[encodings[channel].field] && (
              <DataColumnToken 
                column={columnMetadata[encodings[channel].field]}
                showStats={false}
                onClick={() => {/* Optional click handler */}}
              />
            )}
          </ColumnTokenContainer>
        ) : (
          <DropHint>
            <DragIcon>↓</DragIcon>
            Drop column here or select below
          </DropHint>
        )}
        
        <select
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '0.9rem',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            position: 'relative',
            zIndex: 999999,
            cursor: 'pointer'
          }}
          value={encodings[channel]?.field || ''}
          onChange={(e) => {
            console.log('SELECT CHANGE - Field changed to:', e.target.value);
            const newEncodings = {
              ...encodings,
              [channel]: e.target.value ? {
                field: e.target.value,
                type: fieldTypes[e.target.value]
              } : undefined
            };
            setEncodings(newEncodings);
            onChange({ ...spec, encoding: newEncodings });
          }}
          onFocus={handleSelectFocus}
          onBlur={handleSelectBlur}
          onClick={handleSelectClick}
          onMouseDown={handleSelectMouseDown}
        >
          <option value="">Select field</option>
          {fields.map(field => (
            <option key={field} value={field}>
              {field} ({fieldTypes[field]})
            </option>
          ))}
        </select>
        
        {encodings[channel]?.field && (
          <>
            <TypeButtons>
              {[
                { type: 'quantitative', icon: <NumbersIcon />, label: 'Number' },
                { type: 'temporal', icon: <TimelineIcon />, label: 'Time' },
                { type: 'nominal', icon: <CategoryIcon />, label: 'Category' },
                { type: 'ordinal', icon: <BarChartIcon />, label: 'Ordered' }
              ].map(({ type, icon, label }) => {
                const field = encodings[channel]?.field;
                const compatibleTypes = field ? 
                  getCompatibleTypes(field, spec.data?.values || []) : 
                  [];
                
                const isCompatible = compatibleTypes.includes(type);
                
                return (
                  <Tooltip key={type} title={label}>
                    <span>
                      <EncodingTypeButton 
                        $active={encodings[channel]?.type === type}
                        $compatible={isCompatible}
                        onClick={() => isCompatible && handleEncodingChange(channel, { type })}
                        size="small"
                        disabled={!isCompatible}
                      >
                        {icon}
                      </EncodingTypeButton>
                    </span>
                  </Tooltip>
                );
              })}
            </TypeButtons>
            
            {encodings[channel]?.type && (
              <EncodingOptionSelect
                value={
                  encodings[channel]?.aggregate || 
                  encodings[channel]?.timeUnit || 
                  (encodings[channel]?.bin ? 
                    (typeof encodings[channel].bin === 'object' && 'maxbins' in encodings[channel].bin) ? 
                      `bin-${encodings[channel].bin.maxbins}` : 'bin' 
                    : '')
                }
                onChange={(e) => {
                  const value = e.target.value;
                  const update: EncodingUpdate = {};
                  
                  // Clear all transformation properties first
                  update.aggregate = '';
                  update.timeUnit = '';
                  update.bin = '';
                  
                  // Set the selected transformation
                  if (AGGREGATION_OPTIONS.some(opt => opt.value === value)) {
                    update.aggregate = value;
                  } else if (TIME_UNIT_OPTIONS.some(opt => opt.value === value)) {
                    update.timeUnit = value;
                  } else if (value === 'bin') {
                    update.bin = true;
                  } else if (value.startsWith('bin-')) {
                    update.bin = value;
                  }
                  
                  handleEncodingChange(channel, update);
                }}
                onFocus={handleSelectFocus}
                onBlur={handleSelectBlur}
                onClick={handleSelectClick}
                onMouseDown={handleSelectMouseDown}
              >
                <option value="">Select option</option>
                {encodings[channel].type === 'quantitative' && (
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
                {encodings[channel].type === 'temporal' && (
                  <optgroup label="Time Unit">
                    {TIME_UNIT_OPTIONS.filter(opt => opt.value).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </optgroup>
                )}
              </EncodingOptionSelect>
            )}
          </>
        )}
      </DroppableEncodingControl>
    );
  };

  // Update the rendering of available encodings
  const renderEncodingSection = () => {
    return (
      <div>
        {getAvailableEncodings().map(channel => (
          <Control key={channel}>
            <EncodingGrid>
              <Label>{channel.toUpperCase()}</Label>
              <EncodingDropTarget channel={channel} />
            </EncodingGrid>
          </Control>
        ))}
      </div>
    );
  };

  if (!spec) {
    return <div>Invalid specification</div>
  }

  return (
    <Container>
      <DataTabsContainer>
        <DataTab 
          $active={activeDataTab === 'dataset'} 
          onClick={() => setActiveDataTab('dataset')}
        >
          Dataset
        </DataTab>
        <DataTab 
          $active={activeDataTab === 'filter'} 
          onClick={() => setActiveDataTab('filter')}
        >
          Filter
        </DataTab>
        <DataTab 
          $active={activeDataTab === 'chartType'} 
          onClick={() => setActiveDataTab('chartType')}
        >
          Chart Type
        </DataTab>
        <DataTab 
          $active={activeDataTab === 'encoding'} 
          onClick={() => setActiveDataTab('encoding')}
        >
          Encoding
        </DataTab>
      </DataTabsContainer>

      {activeDataTab === 'dataset' && (
        <TabContent>
          <DatasetSelector
            chartId={currentMark}
            currentDataset={currentDataset || ''}
            onSelect={handleDatasetSelect}
            datasetCache={datasetCache}
            setDatasetCache={setDatasetCache}
          />
        </TabContent>
      )}

      {activeDataTab === 'filter' && (
        <TabContent>
          <div>
            <Control>
              <Label>Field</Label>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  position: 'relative',
                  zIndex: 999999,
                  cursor: 'pointer'
                }}
                value={filterField || ''}
                onChange={(e) => {
                  console.log('FILTER FIELD CHANGE:', e.target.value);
                  setFilterField(e.target.value);
                }}
                onFocus={(e) => {
                  console.log('FILTER FIELD FOCUS - Adding dropdown-open class');
                  document.body.classList.add('dropdown-open');
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onBlur={(e) => {
                  console.log('FILTER FIELD BLUR - Removing dropdown-open class');
                  setTimeout(() => {
                    document.body.classList.remove('dropdown-open');
                  }, 150);
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  console.log('FILTER FIELD CLICK');
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  console.log('FILTER FIELD MOUSEDOWN');
                  e.stopPropagation();
                }}
              >
                <option value="">Select field to filter</option>
                {fields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </Control>
            {filterField && (
              <>
                <Control>
                  <Label>Filter Type</Label>
                  <Select
                    value={filterType || ''}
                    onChange={(e) => setFilterType(e.target.value)}
                    onFocus={(e) => {
                      document.body.classList.add('dropdown-open');
                      e.stopPropagation();
                    }}
                    onBlur={(e) => {
                      document.body.classList.remove('dropdown-open');
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greater">Greater than</option>
                    <option value="less">Less than</option>
                  </Select>
                </Control>
                <Control>
                  <Label>Value</Label>
                  <input
                    type="text"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder="Enter filter value"
                  />
                </Control>
                <ActionButton onClick={applyFilter}>
                  Apply Filter
                </ActionButton>
              </>
            )}
          </div>
        </TabContent>
      )}

      {activeDataTab === 'chartType' && (
        <TabContent>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Choose the best visual mark for your data. Different marks work better for different types of data and comparisons.
          </p>
          <MarkTypeGrid>
            {Object.entries(MARK_ENCODINGS).map(([type, config]) => (
              <MarkTypeCard
                key={type}
                $active={currentMark === type}
                onClick={() => handleMarkTypeChange(type as MarkType)}
              >
                <MarkIcon>{config.icon}</MarkIcon>
                <MarkName>{type}</MarkName>
                <MarkTooltip>
                  <div>{config.description}</div>
                  {config.hints && (
                    <ul>
                      {Object.entries(config.hints).map(([hint, description]) => (
                        <li key={hint}>{hint}: {description}</li>
                      ))}
                    </ul>
                  )}
                </MarkTooltip>
              </MarkTypeCard>
            ))}
          </MarkTypeGrid>
        </TabContent>
      )}

      {activeDataTab === 'encoding' && (
        <TabContent>
          <div>
            <div style={{ 
              display: 'flex', 
              gap: '8px',
              marginBottom: '16px' 
            }}>
              <RandomizeButton onClick={handleRandomizeEncodings}>
                🎲 Random
              </RandomizeButton>
              <TemplateButton onClick={() => setShowTemplates(!showTemplates)}>
                📋 Templates
              </TemplateButton>
              <RecommendButton onClick={handleRecommendEncodings}>
                🤖 Smart
              </RecommendButton>
            </div>

            {showTemplates && (
              <div style={{ marginBottom: '16px' }}>
                <Label>Chart Templates</Label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  {templates.map((template, index) => (
                    <RecommendationCard
                      key={index}
                      $active={false}
                      onClick={() => handleApplyTemplate(template)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem' }}>{template.icon}</span>
                        <RecommendationTitle>{template.name}</RecommendationTitle>
                      </div>
                      <RecommendationReason>{template.description}</RecommendationReason>
                    </RecommendationCard>
                  ))}
                </div>
              </div>
            )}

            {recommendations.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Label>AI Recommendations</Label>
                {recommendations.map((rec, i) => (
                  <RecommendationCard
                    key={i}
                    $active={false}
                    onClick={() => applyRecommendation(rec)}
                  >
                    <RecommendationTitle>
                      {rec.chartType} Chart
                      <ConfidenceBadge $confidence={rec.confidence}>
                        {Math.round(rec.confidence * 100)}% confident
                      </ConfidenceBadge>
                    </RecommendationTitle>
                    <RecommendationReason>
                      {rec.reason}
                    </RecommendationReason>
                    <div style={{ fontSize: '0.9rem' }}>
                      Suggested encodings: {Object.entries(rec.suggestedEncodings)
                        .map(([channel, enc]) => {
                          if (Array.isArray(enc)) {
                            return `${channel}: [Array of ${enc.length} fields]`;
                          } else if (enc && typeof enc === 'object' && 'field' in enc && 'type' in enc) {
                            return `${channel}: ${enc.field} (${enc.type})`;
                          }
                          return `${channel}: [${typeof enc}]`;
                        })
                        .join(', ')}
                    </div>
                  </RecommendationCard>
                ))}
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <SectionTitle>Available Columns</SectionTitle>
              <AvailableColumnsContainer>
                {/* Group by data type */}
                {(() => {
                  // Organize columns by type
                  const columnsByType = {
                    quantitative: [] as ColumnMetadata[],
                    temporal: [] as ColumnMetadata[],
                    nominal: [] as ColumnMetadata[],
                    ordinal: [] as ColumnMetadata[]
                  };
                  
                  Object.values(columnMetadata).forEach(column => {
                    if (column.type in columnsByType) {
                      columnsByType[column.type as keyof typeof columnsByType].push(column);
                    } else {
                      columnsByType.nominal.push(column);
                    }
                  });
                  
                  return (
                    <>
                      {Object.entries(columnsByType).map(([type, columns]) => {
                        if (columns.length === 0) return null;
                        
                        return (
                          <ColumnTypeSection key={type}>
                            <ColumnTypeHeading>
                              {type === 'quantitative' && <NumbersIcon fontSize="small" />}
                              {type === 'temporal' && <TimelineIcon fontSize="small" />}
                              {type === 'nominal' && <CategoryIcon fontSize="small" />}
                              {type === 'ordinal' && <BarChartIcon fontSize="small" />}
                              {type.charAt(0).toUpperCase() + type.slice(1)} ({columns.length})
                            </ColumnTypeHeading>
                            <ColumnTokenContainer>
                              {columns.map(column => (
                                <DataColumnToken 
                                  key={column.name}
                                  column={column}
                                  showStats={true}
                                  onClick={(col) => {
                                    const bestChannel = suggestEncodingChannel(col);
                                    if (bestChannel) {
                                      handleColumnDrop(bestChannel, col);
                                    }
                                  }}
                                />
                              ))}
                            </ColumnTokenContainer>
                          </ColumnTypeSection>
                        );
                      })}
                    </>
                  );
                })()}
              </AvailableColumnsContainer>
            </div>

            <div style={{ marginTop: '20px' }}>
              <SectionTitle>Encodings</SectionTitle>
              {renderEncodingSection()}
            </div>
          </div>
        </TabContent>
      )}
    </Container>
  )
}

export const EncodingField: React.FC<{
  label: string;
  field: string;
  type: string;
  onChange: (field: string, type: string) => void;
  availableFields?: string[];
}> = ({ label, field, type, onChange, availableFields = [] }) => {
  const types = [
    { value: 'quantitative', icon: <NumbersIcon />, label: 'Quantitative' },
    { value: 'temporal', icon: <TimelineIcon />, label: 'Time Series' },
    { value: 'nominal', icon: <CategoryIcon />, label: 'Nominal' },
    { value: 'ordinal', icon: <BarChartIcon />, label: 'Ordinal' }
  ]
  
  return (
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
      <EncodingTypeControls>
        {types.map(t => (
          <Tooltip key={t.value} title={t.label}>
            <EncodingTypeButton
              $active={type === t.value}
              onClick={() => onChange(field, t.value)}
              size="small"
            >
              {t.icon}
            </EncodingTypeButton>
          </Tooltip>
        ))}
      </EncodingTypeControls>
    </EncodingRow>
  );
};

// Add these helper functions above the component
const isCompatibleEncoding = (channel: string, markType: MarkType): boolean => {
  const commonChannels = ['x', 'y', 'color', 'tooltip'];
  const compatibleChannels: Record<MarkType, string[]> = {
    bar: [...commonChannels, 'size'],
    line: [...commonChannels, 'strokeWidth', 'order'],
    point: [...commonChannels, 'size', 'shape'],
    circle: [...commonChannels, 'size'],
    area: [...commonChannels, 'order'],
    text: [...commonChannels, 'text', 'size', 'angle'],
    boxplot: commonChannels,
    arc: ['theta', 'radius', 'color', 'tooltip'],
    rect: [...commonChannels, 'size', 'fill', 'stroke'],
    rule: [...commonChannels, 'size', 'strokeWidth'],
    square: [...commonChannels, 'size', 'fill'],
    tick: [...commonChannels, 'size', 'thickness'],
    trail: [...commonChannels, 'size', 'strokeWidth', 'order'],
    image: [...commonChannels, 'url', 'aspect'],
    geoshape: [...commonChannels, 'shape', 'stroke', 'fill'],
    errorband: [...commonChannels, 'extent', 'band'],
    errorbar: [...commonChannels, 'extent'],
    violin: [...commonChannels, 'size', 'fill', 'density']
  };

  return compatibleChannels[markType]?.includes(channel) ?? false;
};

// Add more detailed templates with encoding options
const CHART_TEMPLATES: ChartTemplate[] = [
  {
    name: 'Time Series',
    icon: '📈',
    markType: 'line',
    description: 'Visualize trends over time',
    encodings: {
      x: { type: 'temporal', timeUnit: 'yearmonth' },
      y: { type: 'quantitative' },
      color: { type: 'nominal' }
    },
    config: {
      interpolate: 'monotone',
      point: true
    }
  },
  {
    name: 'Bar Comparison',
    icon: '📊',
    markType: 'bar',
    description: 'Compare values across categories',
    encodings: {
      x: { type: 'nominal' },
      y: { type: 'quantitative', aggregate: 'sum' },
      color: { type: 'nominal' }
    }
  },
  {
    name: 'Scatter Plot',
    icon: '🔵',
    markType: 'point',
    description: 'Visualize relationships between two variables',
    encodings: {
      x: { type: 'quantitative' },
      y: { type: 'quantitative' },
      size: { type: 'quantitative' },
      color: { type: 'nominal' }
    }
  },
  {
    name: 'Binned Heatmap',
    icon: '🟦',
    markType: 'rect',
    description: 'Show density of points with binning',
    encodings: {
      x: { type: 'quantitative', bin: true },
      y: { type: 'quantitative', bin: true },
      color: { type: 'quantitative', aggregate: 'count' }
    }
  },
  {
    name: 'Pie Chart',
    icon: '🥧',
    markType: 'arc',
    description: 'Show composition of a whole',
    encodings: {
      theta: { type: 'quantitative', aggregate: 'sum' },
      color: { type: 'nominal' }
    }
  },
  {
    name: 'Box Plot',
    icon: '📦',
    markType: 'boxplot',
    description: 'Show distribution statistics',
    encodings: {
      x: { type: 'nominal' },
      y: { type: 'quantitative' },
      color: { type: 'nominal' }
    }
  },
  {
    name: 'Monthly Trends',
    icon: '📅',
    markType: 'line',
    description: 'Visualize monthly patterns',
    encodings: {
      x: { type: 'temporal', timeUnit: 'month' },
      y: { type: 'quantitative', aggregate: 'mean' },
      color: { type: 'nominal' }
    }
  },
  {
    name: 'Histogram',
    icon: '📊',
    markType: 'bar',
    description: 'Show distribution of values',
    encodings: {
      x: { type: 'quantitative', bin: { maxbins: 20 } },
      y: { type: 'quantitative', aggregate: 'count' }
    }
  }
];

 