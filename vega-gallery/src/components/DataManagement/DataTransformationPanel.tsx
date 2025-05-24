import React, { useState } from 'react';
import styled from 'styled-components';
import { DatasetMetadata } from '../../types/dataset';
import { storeDataset } from '../../utils/indexedDB';
import { detectDataTypes } from '../../utils/dataUtils';

const Panel = styled.div`
  background: var(--color-surface);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  color: var(--color-text-primary);
`;

const Content = styled.div`
  padding: 16px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  margin-bottom: 16px;
  color: var(--color-text-primary);
`;

const TransformationCard = styled.div`
  padding: 16px;
  background: var(--color-background);
  border-radius: 6px;
  margin-bottom: 16px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  margin-bottom: 8px;
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

const PreviewTable = styled.div`
  overflow-x: auto;
  margin-top: 16px;
  
  table {
    width: 100%;
    border-collapse: collapse;
    
    th, td {
      padding: 8px;
      border: 1px solid var(--color-border);
      text-align: left;
    }
    
    th {
      background: var(--color-background);
    }
  }
`;

interface DataTransformationPanelProps {
  dataset: DatasetMetadata;
  onComplete: () => void;
}

export const DataTransformationPanel: React.FC<DataTransformationPanelProps> = ({
  dataset,
  onComplete
}) => {
  const [transformedData, setTransformedData] = useState(dataset.values);
  const [selectedTransform, setSelectedTransform] = useState('filter');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [aggregateColumn, setAggregateColumn] = useState('');
  const [aggregateFunction, setAggregateFunction] = useState('sum');

  const columns = Object.keys(dataset.values[0] || {});

  const applyTransformation = () => {
    let newData = [...transformedData];

    switch (selectedTransform) {
      case 'filter':
        newData = newData.filter(row => 
          String(row[filterColumn]).includes(filterValue)
        );
        break;

      case 'aggregate':
        const grouped = newData.reduce((acc, row) => {
          const key = row[aggregateColumn];
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(row);
          return acc;
        }, {});

        newData = Object.entries(grouped).map(([key, group]) => {
          const result = { [aggregateColumn]: key };
          columns.forEach(col => {
            if (col !== aggregateColumn) {
              const values = (group as any[]).map(row => row[col]);
              switch (aggregateFunction) {
                case 'sum':
                  result[col] = values.reduce((a, b) => a + (Number(b) || 0), 0);
                  break;
                case 'avg':
                  result[col] = values.reduce((a, b) => a + (Number(b) || 0), 0) / values.length;
                  break;
                case 'count':
                  result[col] = values.length;
                  break;
                case 'min':
                  result[col] = Math.min(...values.map(v => Number(v) || 0));
                  break;
                case 'max':
                  result[col] = Math.max(...values.map(v => Number(v) || 0));
                  break;
              }
            }
          });
          return result;
        });
        break;

      case 'sort':
        newData.sort((a, b) => {
          const valA = a[filterColumn];
          const valB = b[filterColumn];
          return valA < valB ? -1 : valA > valB ? 1 : 0;
        });
        break;
    }

    setTransformedData(newData);
  };

  const handleSave = async () => {
    try {
      const newDataset: DatasetMetadata = {
        ...dataset,
        id: `${dataset.id}-transformed-${Date.now()}`,
        name: `${dataset.name} (Transformed)`,
        values: transformedData,
        rowCount: transformedData.length,
        columnCount: Object.keys(transformedData[0] || {}).length,
        dataTypes: detectDataTypes(transformedData),
        uploadDate: new Date().toISOString(),
        transformed: true
      };

      await storeDataset(newDataset);
      onComplete();
    } catch (error) {
      console.error('Failed to save transformed dataset:', error);
    }
  };

  return (
    <Panel>
      <Header>
        <Title>Transform Dataset: {dataset.name}</Title>
        <Button onClick={handleSave}>Save Transformation</Button>
      </Header>

      <Content>
        <Section>
          <SectionTitle>Transformation Options</SectionTitle>
          <Grid>
            <TransformationCard>
              <Select 
                value={selectedTransform}
                onChange={e => setSelectedTransform(e.target.value)}
              >
                <option value="filter">Filter</option>
                <option value="aggregate">Aggregate</option>
                <option value="sort">Sort</option>
              </Select>

              {selectedTransform === 'filter' && (
                <>
                  <Select
                    value={filterColumn}
                    onChange={e => setFilterColumn(e.target.value)}
                  >
                    <option value="">Select column</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </Select>
                  <Input
                    type="text"
                    placeholder="Filter value"
                    value={filterValue}
                    onChange={e => setFilterValue(e.target.value)}
                  />
                </>
              )}

              {selectedTransform === 'aggregate' && (
                <>
                  <Select
                    value={aggregateColumn}
                    onChange={e => setAggregateColumn(e.target.value)}
                  >
                    <option value="">Group by column</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </Select>
                  <Select
                    value={aggregateFunction}
                    onChange={e => setAggregateFunction(e.target.value)}
                  >
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                    <option value="count">Count</option>
                    <option value="min">Minimum</option>
                    <option value="max">Maximum</option>
                  </Select>
                </>
              )}

              {selectedTransform === 'sort' && (
                <Select
                  value={filterColumn}
                  onChange={e => setFilterColumn(e.target.value)}
                >
                  <option value="">Sort by column</option>
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </Select>
              )}

              <Button onClick={applyTransformation}>
                Apply Transformation
              </Button>
            </TransformationCard>
          </Grid>
        </Section>

        <Section>
          <SectionTitle>Preview</SectionTitle>
          <PreviewTable>
            <table>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transformedData.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {columns.map(col => (
                      <td key={col}>{String(row[col])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </PreviewTable>
        </Section>
      </Content>
    </Panel>
  );
}; 