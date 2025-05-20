import { TopLevelSpec, Config as VegaLiteConfig } from 'vega-lite'
import { DatasetMetadata } from './dataset'

export type EncodingChannel = 
  | 'x' | 'y' | 'color' | 'size' | 'tooltip' | 'opacity'
  | 'strokeWidth' | 'shape' | 'text' | 'angle'
  | 'theta' | 'radius' | 'x2' | 'y2'
  | 'url' | 'width' | 'height' | 'order'
  | 'dimensions' | 'detail' | 'density' | 'bandwidth'
  | 'column' | 'row' | 'facet' | 'key' | 'href';
export type MarkType = 
  | 'bar' 
  | 'line' 
  | 'area' 
  | 'point' 
  | 'circle' 
  | 'square'
  | 'rect'
  | 'rule'
  | 'text'
  | 'tick'
  | 'arc'
  | 'pie'
  | 'boxplot'
  | 'violin'
  | 'trail'
  | 'treemap'
  | 'sunburst'
  | 'wordcloud'
  | 'chord-diagram'
  | 'force-directed'
  | 'parallel-coordinates';

export interface EncodingUpdate {
  field?: string
  type?: 'quantitative' | 'nominal' | 'ordinal' | 'temporal'
}

export interface VisualEditorUpdate {
  mark?: MarkType
  encoding?: Partial<Record<EncodingChannel, EncodingUpdate>>
}

export interface DatasetSelectorBaseProps {
  chartId: string;
  currentDataset: string;
  onSelect: (datasetId: string) => void;
  customDatasets?: Record<string, DatasetMetadata>;
  setCustomDatasets?: (datasets: Record<string, DatasetMetadata>) => void;
}

export interface EncodingField {
  field: string;
  type?: string;
  aggregate?: 'count' | 'sum' | 'mean' | 'median' | 'min' | 'max';
  scale?: {
    zero?: boolean;
    range?: number[];
    type?: 'linear' | 'log' | 'pow' | 'sqrt';
  };
  sort?: 'ascending' | 'descending' | null;
  stack?: 'zero' | 'normalize' | 'center' | null;
  bin?: boolean | {maxbins?: number};
  timeUnit?: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';
  format?: string;
}

export interface ChartEncoding {
  x?: EncodingChannel;
  y?: EncodingChannel;
  color?: EncodingChannel;
  size?: EncodingChannel;
  [key: string]: EncodingChannel | undefined;
}

// First, let's extend our Vega spec type to include all possible properties
export interface VegaMarkConfig {
  // Common mark properties
  type?: MarkType;
  tooltip?: boolean | object;
  point?: boolean;
  filled?: boolean;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokeDash?: number[];
  size?: number;
  opacity?: number;
  
  // Shape properties
  cornerRadius?: number;
  cornerRadiusTopLeft?: number;
  cornerRadiusTopRight?: number;
  cornerRadiusBottomLeft?: number;
  cornerRadiusBottomRight?: number;
  
  // Line properties
  interpolate?: 'linear' | 'step' | 'stepAfter' | 'stepBefore' | 'basis' | 'cardinal' | 'monotone';
  tension?: number;
  line?: boolean; // For area charts
  
  // Point/Circle properties
  shape?: string;
  
  // Text properties
  fontSize?: number;
  font?: string;
  fontStyle?: string;
  fontWeight?: string | number;
  align?: 'left' | 'center' | 'right';
  angle?: number;
  
  // Bar specific
  orient?: 'vertical' | 'horizontal';
  
  // Arc specific
  innerRadius?: number;
  outerRadius?: number;
  padAngle?: number;
  theta?: any; // For arc/pie charts
  radius?: any; // For arc/pie charts
  
  // Effects
  cursor?: string;
  href?: string;
  blend?: string;

  // Advanced fill options
  gradient?: GradientConfig;
  pattern?: PatternConfig;
  
  // Effects
  shadow?: ShadowConfig[];
  blur?: number;
  glow?: {
    color: string;
    radius: number;
    intensity: number;
  };
  
  // 3D effects
  depth?: number;
  bevel?: {
    size: number;
    highlight: string;
    shadow: string;
  };
  
  // Animation
  animation?: AnimationConfig;
  transition?: {
    enter?: AnimationConfig;
    update?: AnimationConfig;
    exit?: AnimationConfig;
  };
  
  // Interactions
  interactions?: InteractionConfig;
  
  // Advanced stroke options
  strokeGradient?: GradientConfig;
  strokePattern?: PatternConfig;
  strokeAlignment?: 'inner' | 'outer' | 'center';
  strokeLineCap?: 'butt' | 'round' | 'square';
  strokeLineJoin?: 'miter' | 'round' | 'bevel';
  strokeMiterLimit?: number;
  
  // Clipping and masking
  clip?: boolean;
  mask?: {
    shape?: string;
    image?: string;
    gradient?: GradientConfig;
  };
  
  // Filters
  filters?: Array<{
    type: 'blur' | 'brightness' | 'contrast' | 'saturate' | 'hue-rotate';
    value: number;
  }>;
  
  // Text specific
  textShadow?: ShadowConfig;
  letterSpacing?: number;
  lineHeight?: number;
  textDecoration?: 'none' | 'underline' | 'line-through';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  
  // Bar specific
  borderRadius?: {
    topLeft?: number;
    topRight?: number;
    bottomLeft?: number;
    bottomRight?: number;
  };
  
  // Point/Circle specific
  symbolShape?: 'circle' | 'square' | 'cross' | 'diamond' | 'triangle' | 'star';
  
  // Line specific
  lineDash?: number[];
  lineDashOffset?: number;
  lineJoin?: 'miter' | 'round' | 'bevel';
  lineCap?: 'butt' | 'round' | 'square';
  
  // Arc specific
  startAngle?: number;
  endAngle?: number;
  padRadius?: number;
  
  // Advanced rendering
  compositeOperation?: string;
  imageSmoothing?: boolean;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
}

export interface ExtendedSpec extends Omit<TopLevelSpec, 'mark' | 'config'> {
  mark?: MarkType | {
    type: MarkType;
    // Common properties
    tooltip?: boolean;
    point?: boolean;
    filled?: boolean;
    size?: number;
    shape?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    
    // Line specific
    interpolate?: 'linear' | 'step' | 'stepAfter' | 'stepBefore' | 'basis' | 'cardinal' | 'monotone';
    line?: boolean; // For area marks
    
    // Bar specific
    cornerRadius?: number;
    orient?: 'vertical' | 'horizontal';
    
    // Arc specific
    innerRadius?: number;
    outerRadius?: number;
    
    // Any other properties
    [key: string]: unknown;
  };
  
  // Add support for _renderKey to help force re-renders
  config?: VegaLiteConfig & {
    _renderKey?: number;
    _forceNewView?: number;
  };
}

// Add these new interfaces for advanced styling
export interface GradientConfig {
  type: 'linear' | 'radial';
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  r1?: number;
  r2?: number;
  stops: Array<{
    offset: number;
    color: string;
    opacity?: number;
  }>;
}

export interface PatternConfig {
  type: 'pattern';
  style: 'dots' | 'crosses' | 'lines' | 'squares' | 'diagonal';
  background?: string;
  foreground?: string;
  size?: number;
  rotation?: number;
}

export interface ShadowConfig {
  type: 'drop-shadow' | 'inner-shadow';
  color?: string;
  blur?: number;
  offsetX?: number;
  offsetY?: number;
  spread?: number;
  opacity?: number;
}

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: 'linear' | 'cubic' | 'elastic' | 'bounce';
  loop?: boolean;
  properties?: string[];
}

export interface InteractionConfig {
  hover?: {
    fill?: string;
    stroke?: string;
    opacity?: number;
    scale?: number;
    cursor?: string;
  };
  active?: {
    fill?: string;
    stroke?: string;
    opacity?: number;
    scale?: number;
  };
  tooltip?: {
    template?: string;
    style?: object;
    offset?: { x: number; y: number };
  };
}

// Add new interfaces for axis and legend styling
export interface AxisStyleConfig {
  // ... existing axis properties ...
  
  // Grid styling
  grid?: {
    pattern?: 'solid' | 'dashed' | 'dotted';
    color?: string;
    opacity?: number;
    width?: number;
  };
  
  // Tick styling
  ticks?: {
    color?: string;
    width?: number;
    size?: number;
    padding?: number;
    count?: number;
    offset?: number;
  };
  
  // Label styling
  labels?: {
    font?: string;
    size?: number;
    color?: string;
    angle?: number;
    offset?: number;
    padding?: number;
    format?: string;
    truncate?: number;
  };
  
  // Title styling
  title?: {
    font?: string;
    size?: number;
    color?: string;
    anchor?: 'start' | 'middle' | 'end';
    offset?: number;
    orient?: 'top' | 'bottom' | 'left' | 'right';
  };
} 