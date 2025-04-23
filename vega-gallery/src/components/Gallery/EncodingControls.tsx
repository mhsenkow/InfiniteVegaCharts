import React from 'react';
import styled from 'styled-components';
import { ChartEncoding } from '../../types/vega';
import { Button } from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { generateRandomEncoding } from '../../utils/chartAdapters';
import { detectDataTypes } from '../../utils/dataUtils';

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
  const handleRandomizeEncodings = () => {
    if (availableFields.length === 0) {
      console.warn('No available fields for encoding');
      return;
    }
    
    // Detect data types for available fields
    const dataTypes = dataset && dataset.length > 0 
      ? detectDataTypes(dataset) 
      : availableFields.reduce((acc, field) => ({...acc, [field]: 'nominal'}), {});
    
    const randomEncoding = generateRandomEncoding(chartType, availableFields, dataTypes);
    onEncodingChange(randomEncoding);
  };

  return (
    <EncodingSection>
      <EncodingTitle>
        Encoding
        <ButtonContainer>
          <StyledButton
            startIcon={<ShuffleIcon />}
            onClick={handleRandomizeEncodings}
            variant="outlined"
            size="small"
            disabled={availableFields.length === 0}
          >
            Randomize
          </StyledButton>
        </ButtonContainer>
      </EncodingTitle>
      {children}
    </EncodingSection>
  );
};

export const EncodingField: React.FC<{
  label: string;
  field: string;
  type: string;
  onChange: (field: string, type: string) => void;
  availableFields?: string[];
}> = ({ label, field, type, onChange, availableFields = [] }) => {
  const types = ['quantitative', 'nominal', 'ordinal', 'temporal'];
  
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
      <select 
        value={type} 
        onChange={(e) => onChange(field, e.target.value)}
      >
        {types.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </EncodingRow>
  );
}; 