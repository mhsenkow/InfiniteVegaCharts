import React from 'react';
import { MarkType } from '../types/vega';

interface IconProps {
  size?: number;
  color?: string;
}

const defaultProps = {
  size: 20,
  color: 'currentColor'
};

export const BarChartIcon: React.FC<IconProps> = (props) => {
  const { size, color } = { ...defaultProps, ...props };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="14" width="4" height="6" rx="1" fill={color} />
      <rect x="10" y="8" width="4" height="12" rx="1" fill={color} />
      <rect x="16" y="4" width="4" height="16" rx="1" fill={color} />
    </svg>
  );
};

export const LineChartIcon: React.FC<IconProps> = (props) => {
  const { size, color } = { ...defaultProps, ...props };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19L8 13L12 15L20 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 5V19H20" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
};

export const AreaChartIcon: React.FC<IconProps> = (props) => {
  const { size, color } = { ...defaultProps, ...props };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19L8 13L12 15L20 5V19H4Z" fill={color} fillOpacity="0.3" />
      <path d="M4 19L8 13L12 15L20 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const ScatterPlotIcon: React.FC<IconProps> = (props) => {
  const { size, color } = { ...defaultProps, ...props };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="14" r="2" fill={color} />
      <circle cx="14" cy="8" r="2" fill={color} />
      <circle cx="18" cy="16" r="2" fill={color} />
      <circle cx="10" cy="4" r="2" fill={color} />
      <circle cx="5" cy="6" r="2" fill={color} />
      <path d="M4 5V19H20" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
};

export const PieChartIcon: React.FC<IconProps> = (props) => {
  const { size, color } = { ...defaultProps, ...props };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12L19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 8.13401 8.13401 5 12 5V12Z" fill={color} fillOpacity="0.3" />
      <path d="M12 12L17 7.5C15.6667 6.16667 14 5.5 12 5.5V12Z" fill={color} />
      <circle cx="12" cy="12" r="7" stroke={color} strokeWidth="1.5" />
    </svg>
  );
};

export const HeatmapIcon: React.FC<IconProps> = (props) => {
  const { size, color } = { ...defaultProps, ...props };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="4" height="4" rx="1" fill={color} fillOpacity="0.3" />
      <rect x="10" y="5" width="4" height="4" rx="1" fill={color} fillOpacity="0.5" />
      <rect x="15" y="5" width="4" height="4" rx="1" fill={color} fillOpacity="0.7" />
      <rect x="5" y="10" width="4" height="4" rx="1" fill={color} fillOpacity="0.5" />
      <rect x="10" y="10" width="4" height="4" rx="1" fill={color} fillOpacity="0.7" />
      <rect x="15" y="10" width="4" height="4" rx="1" fill={color} fillOpacity="0.9" />
      <rect x="5" y="15" width="4" height="4" rx="1" fill={color} fillOpacity="0.7" />
      <rect x="10" y="15" width="4" height="4" rx="1" fill={color} fillOpacity="0.9" />
      <rect x="15" y="15" width="4" height="4" rx="1" fill={color} />
    </svg>
  );
};

export const BoxPlotIcon: React.FC<IconProps> = (props) => {
  const { size, color } = { ...defaultProps, ...props };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 10V14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 10V14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 5V7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 17V19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="7" y="7" width="10" height="10" rx="1" stroke={color} strokeWidth="1.5" />
      <path d="M7 12H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

export const TreemapIcon: React.FC<IconProps> = (props) => {
  const { size, color } = { ...defaultProps, ...props };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="4" y="4" width="10" height="10" rx="1" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
      <rect x="14" y="4" width="6" height="10" rx="1" fill={color} fillOpacity="0.5" stroke={color} strokeWidth="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1" fill={color} fillOpacity="0.7" stroke={color} strokeWidth="1.5" />
      <rect x="10" y="14" width="10" height="6" rx="1" fill={color} fillOpacity="0.9" stroke={color} strokeWidth="1.5" />
    </svg>
  );
};

export const ParallelCoordinatesIcon: React.FC<IconProps> = (props) => {
  const { size, color } = { ...defaultProps, ...props };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19V5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 19V5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 19V5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 12L12 8L20 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" />
      <path d="M4 8L12 16L20 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const WordCloudIcon: React.FC<IconProps> = (props) => {
  const { size, color } = { ...defaultProps, ...props };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="6" y="9" fontSize="5" fill={color}>data</text>
      <text x="4" y="14" fontSize="3" fill={color}>charts</text>
      <text x="12" y="12" fontSize="4" fill={color}>viz</text>
      <text x="9" y="17" fontSize="3.5" fill={color}>graph</text>
      <text x="14" y="8" fontSize="3" fill={color}>info</text>
    </svg>
  );
};

const iconMap: Record<string, React.FC<IconProps>> = {
  bar: BarChartIcon,
  line: LineChartIcon,
  area: AreaChartIcon,
  point: ScatterPlotIcon,
  circle: ScatterPlotIcon,
  square: ScatterPlotIcon,
  arc: PieChartIcon,
  rect: HeatmapIcon,
  boxplot: BoxPlotIcon,
  treemap: TreemapIcon,
  'parallel-coordinates': ParallelCoordinatesIcon, 
  text: WordCloudIcon,
  wordcloud: WordCloudIcon,
};

export const getIconForMarkType = (markType: MarkType): React.FC<IconProps> => {
  return iconMap[markType] || ScatterPlotIcon;
}; 