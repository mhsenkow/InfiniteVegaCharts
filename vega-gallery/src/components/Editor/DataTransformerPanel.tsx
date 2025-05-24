import React, { useState } from 'react';
import styled from 'styled-components';
import { DatasetMetadata } from '../../types/dataset';

const Panel = styled.div`
  padding: 16px;
  background: var(--color-surface);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  margin-bottom: 16px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 16px;
  color: var(--color-text-primary);
`;

const TransformControl = styled.div`
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background: var(--color-primary);
  color: var(--color-surface);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

interface DataTransformerPanelProps {
  dataset: DatasetMetadata;
  onDatasetUpdate: (dataset: DatasetMetadata) => void;
}

export const DataTransformerPanel: React.FC<DataTransformerPanelProps> = ({
  dataset,
  onDatasetUpdate
}) => {
  const [selectedTransform, setSelectedTransform] = useState('filter');
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [aggregateField, setAggregateField] = useState('');
  const [aggregateFunction, setAggregateFunction] = useState('sum');

  const applyTransformation = () => {
    let transformedData = [...dataset.values];

    switch (selectedTransform) {
      case 'filter':
        transformedData = transformedData.filter(row => 
          String(row[filterField]).includes(filterValue)
        );
        break;

      case 'aggregate':
        transformedData = transformedData.reduce((acc, row) => {
          const key = row[aggregateField];
          if (!acc[key]) {
            acc[key] = { [aggregateField]: key, value: 0 };
          }
          
          switch (aggregateFunction) {
            case 'sum':
              acc[key].value += Number(row.value) || 0;
              break;
            case 'avg':
              if (!acc[key].count) acc[key].count = 0;
              acc[key].count++;
              acc[key].value += Number(row.value) || 0;
              break;
            case 'count':
              acc[key].value++;
              break;
          }
          return acc;
        }, {});

        if (aggregateFunction === 'avg') {
          Object.values(transformedData).forEach(row => {
            row.value = row.value / row.count;
            delete row.count;
          });
        }

        transformedData = Object.values(transformedData);
        break;

      case 'sort':
        transformedData.sort((a, b) => {
          const valA = a[filterField];
          const valB = b[filterField];
          return valA < valB ? -1 : valA > valB ? 1 : 0;
        });
        break;
    }

    onDatasetUpdate({
      ...dataset,
      values: transformedData
    });
  };

  const fields = Object.keys(dataset.values[0] || {});

  return (
    <Panel>
      <SectionTitle>Data Transformations</SectionTitle>

      <Section>
        <Select 
          value={selectedTransform}
          onChange={e => setSelectedTransform(e.target.value)}
        >
          <option value="filter">Filter</option>
          <option value="aggregate">Aggregate</option>
          <option value="sort">Sort</option>
        </Select>

        {selectedTransform === 'filter' && (
          <TransformControl>
            <Select 
              value={filterField}
              onChange={e => setFilterField(e.target.value)}
            >
              <option value="">Select field</option>
              {fields.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </Select>
            <Input
              type="text"
              placeholder="Filter value"
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
            />
          </TransformControl>
        )}

        {selectedTransform === 'aggregate' && (
          <TransformControl>
            <Select
              value={aggregateField}
              onChange={e => setAggregateField(e.target.value)}
            >
              <option value="">Group by field</option>
              {fields.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </Select>
            <Select
              value={aggregateFunction}
              onChange={e => setAggregateFunction(e.target.value)}
            >
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="count">Count</option>
            </Select>
          </TransformControl>
        )}

        {selectedTransform === 'sort' && (
          <TransformControl>
            <Select
              value={filterField}
              onChange={e => setFilterField(e.target.value)}
            >
              <option value="">Sort by field</option>
              {fields.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </Select>
          </TransformControl>
        )}

        <Button onClick={applyTransformation}>
          Apply Transformation
        </Button>
      </Section>
    </Panel>
  );
}; 