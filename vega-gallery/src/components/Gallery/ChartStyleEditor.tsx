import React from 'react';
import styled from 'styled-components';
import { ChartStyle } from '../../types/chart';

const StyleEditorContainer = styled.div`
  padding: 16px;
  background: var(--color-surface);
  border-radius: 8px;
`;

const ControlGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
`;

interface ChartStyleEditorProps {
  style: ChartStyle;
  onChange: (style: ChartStyle) => void;
}

export const ChartStyleEditor: React.FC<ChartStyleEditorProps> = ({ style, onChange }) => {
  // Initialize default style if not provided
  const defaultStyle: ChartStyle = {
    axis: {
      tickOpacity: 1,
      baselineColor: window.getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim() || '#000000',
      baselineWidth: 1,
      baselineOpacity: 1,
    },
    view: {
      backgroundColor: window.getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim() || '#ffffff',
      backgroundOpacity: 1,
      padding: 5,
    }
  };

  const currentStyle = {
    axis: { ...defaultStyle.axis, ...style.axis },
    view: { ...defaultStyle.view, ...style.view },
  };

  return (
    <StyleEditorContainer>
      <ControlGroup>
        <Label>Tick Opacity</Label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={currentStyle.axis.tickOpacity}
          onChange={(e) => onChange({
            ...style,
            axis: { ...style.axis, tickOpacity: parseFloat(e.target.value) }
          })}
        />
      </ControlGroup>

      <ControlGroup>
        <Label>Baseline Color</Label>
        <input
          type="color"
          value={style.axis?.baselineColor ?? '#000000'}
          onChange={(e) => onChange({
            ...style,
            axis: { ...style.axis, baselineColor: e.target.value }
          })}
        />
      </ControlGroup>

      <ControlGroup>
        <Label>Baseline Width</Label>
        <input
          type="number"
          value={style.axis?.baselineWidth ?? 1}
          onChange={(e) => onChange({
            ...style,
            axis: { ...style.axis, baselineWidth: parseInt(e.target.value) }
          })}
        />
      </ControlGroup>

      <ControlGroup>
        <Label>Baseline Opacity</Label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={style.axis?.baselineOpacity ?? 1}
          onChange={(e) => onChange({
            ...style,
            axis: { ...style.axis, baselineOpacity: parseFloat(e.target.value) }
          })}
        />
      </ControlGroup>

      <ControlGroup>
        <Label>Background Color</Label>
        <input
          type="color"
          value={style.view?.backgroundColor ?? '#ffffff'}
          onChange={(e) => onChange({
            ...style,
            view: { ...style.view, backgroundColor: e.target.value }
          })}
        />
      </ControlGroup>

      <ControlGroup>
        <Label>Background Opacity</Label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={style.view?.backgroundOpacity ?? 1}
          onChange={(e) => onChange({
            ...style,
            view: { ...style.view, backgroundOpacity: parseFloat(e.target.value) }
          })}
        />
      </ControlGroup>

      <ControlGroup>
        <Label>Chart Padding</Label>
        <input
          type="number"
          value={style.view?.padding ?? 0}
          onChange={(e) => onChange({
            ...style,
            view: { ...style.view, padding: parseInt(e.target.value) }
          })}
        />
      </ControlGroup>
    </StyleEditorContainer>
  );
}; 