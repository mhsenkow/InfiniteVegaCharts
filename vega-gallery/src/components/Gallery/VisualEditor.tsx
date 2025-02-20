import React, { useState } from 'react';
import styled from 'styled-components';
import { ChartEncoding, MarkType } from '../../types/vega';
import { EncodingControls } from './EncodingControls';

const EditorControls = styled.div`
  display: flex;
  gap: 8px;
  margin: 12px 0;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  
  &:hover {
    background: #f0f0f0;
    border-color: #999;
  }
`;

const EncodingSection = styled.div`
  margin-top: 16px;
`;

interface VisualEditorProps {
  chartType: MarkType;
  dataset: any;
  onEncodingChange: (encoding: ChartEncoding | null) => void;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({
  chartType,
  dataset,
  onEncodingChange
}) => {
  const [encoding, setEncoding] = useState<ChartEncoding>({});

  const handleEncodingChange = (channel: string, field: string, type: string) => {
    const newEncoding = {
      ...encoding,
      [channel]: { field, type }
    };
    setEncoding(newEncoding);
    onEncodingChange(newEncoding);
  };

  return (
    <div>
      <EncodingSection>
        <EncodingControls
          chartType={chartType}
          dataset={dataset}
          onEncodingChange={onEncodingChange}
          availableFields={getAvailableFields(dataset)}
        >
          <EncodingField
            label="X"
            field={encoding.x?.field || ""}
            type={encoding.x?.type || "quantitative"}
            onChange={(field, type) => handleEncodingChange('x', field, type)}
          />
          <EncodingField
            label="Y"
            field={encoding.y?.field || ""}
            type={encoding.y?.type || "quantitative"}
            onChange={(field, type) => handleEncodingChange('y', field, type)}
          />
          <EncodingField
            label="COLOR"
            field={encoding.color?.field || ""}
            type={encoding.color?.type || "nominal"}
            onChange={(field, type) => handleEncodingChange('color', field, type)}
          />
          <EncodingField
            label="SIZE"
            field={encoding.size?.field || ""}
            type={encoding.size?.type || "quantitative"}
            onChange={(field, type) => handleEncodingChange('size', field, type)}
          />
        </EncodingControls>
      </EncodingSection>
    </div>
  );
};

function getAvailableFields(dataset: any): string[] {
  if (!dataset || !dataset.length) return [];
  return Object.keys(dataset[0]);
} 