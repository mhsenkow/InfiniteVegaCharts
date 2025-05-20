import { TopLevelSpec } from 'vega-lite';

export enum ChartCategory {
  Statistical = 'Statistical',
  TimeSeries = 'Time Series',
  Comparison = 'Comparison',
  Correlation = 'Correlation',
  PartToWhole = 'Part-to-Whole',
  Hierarchical = 'Hierarchical',
  TextAnalysis = 'Text Analysis'
}

export enum Complexity {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced'
}

export type ChartUseCase = 
  | 'Data Analysis' 
  | 'Business Reporting' 
  | 'Scientific Visualization' 
  | 'Dashboard'

export interface ChartStyle {
  marks?: {
    opacity?: number;
    strokeWidth?: number;
    stroke?: string;
    fill?: string;
    filled?: boolean;
    [key: string]: any;
  };
  axis?: {
    tickOpacity?: number;
    gridOpacity?: number;
    labelFontSize?: number;
    titleFontSize?: number;
    [key: string]: any;
  };
  legend?: {
    titleFontSize?: number;
    labelFontSize?: number;
    [key: string]: any;
  };
  view?: {
    stroke?: string | null;
    fill?: string;
    padding?: number;
    [key: string]: any;
  };
}

export interface ChartConfig {
  id: string;
  title: string;
  description: string;
  category: ChartCategory;
  complexity: Complexity;
  spec: any; // Could be more specific with Vega types
  metadata?: {
    tags?: string[];
    dataRequirements?: {
      requiredFields: string[];
    };
    useCase?: string[];
    dataTypes?: string[];
    keywords?: string[];
  };
  style?: Partial<ChartStyle>;
}

export interface ChartMetadata {
  id: string;
  title: string;
  category: ChartCategory;
  description: string;
  tags: string[];
  thumbnail?: string;
}

export interface ChartDefinition extends ChartMetadata {
  spec: any; // Vega-Lite specification
  data?: any; // Optional data if not embedded in spec
}

export type ChartType = 
  | 'point' 
  | 'line' 
  | 'area' 
  | 'bar' 
  | 'boxplot' 
  | 'violin' 
  | 'heatmap' 
  | 'arc' 
  | 'treemap';

export interface EncodingField {
  field: string;
  type: string;
  aggregate?: string;
  scale?: any;
  bin?: boolean;
  point?: boolean;
  sort?: string | object;
  title?: string;
  format?: string;
  stack?: boolean | string;
}

// Add support for tooltip arrays
export type TooltipEncoding = EncodingField | EncodingField[];
