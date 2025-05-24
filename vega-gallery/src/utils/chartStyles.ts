import { ChartStyle } from '../types/chart';

export const defaultChartStyle: ChartStyle = {
  colors: {
    primary: '#4C78A8',
    secondary: '#72B7B2',
    background: 'var(--color-surface)'
  },
  marks: {
    opacity: 0.6,
    stroke: 'white',
    strokeWidth: 1,
    blend: 'multiply'
  },
  view: {
    padding: 20,
    stroke: null
  }
};

export function applyChartStyle(spec: any, style: Partial<ChartStyle> = {}): any {
  const mergedStyle = { ...defaultChartStyle, ...style };
  
  return {
    ...spec,
    config: {
      ...spec.config,
      view: {
        ...spec.config?.view,
        ...mergedStyle.view
      }
    },
    mark: {
      ...spec.mark,
      ...mergedStyle.marks
    },
    encoding: {
      ...spec.encoding,
      color: spec.encoding.color || { value: mergedStyle.colors.primary }
    }
  };
} 