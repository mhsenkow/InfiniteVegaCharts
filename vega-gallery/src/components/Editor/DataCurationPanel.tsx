import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DatasetMetadata } from '../../types/dataset';

const Panel = styled.div`
  background: var(--color-surface);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  margin-top: 8px;
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
  max-height: ${props => props.$isOpen ? 'none' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;

  > * {
    padding: 16px;
  }
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 16px;
  color: var(--color-text-primary);
`;

const MetricCard = styled.div`
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  margin-bottom: 12px;
`;

const MetricValue = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-primary);
`;

const MetricLabel = styled.div`
  font-size: 0.9rem;
  color: var(--color-text-secondary);
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

interface DataCurationPanelProps {
  dataset: DatasetMetadata;
  onDatasetUpdate: (dataset: DatasetMetadata) => void;
}

// Add interface for accordion states
interface AccordionStates {
  quality: boolean;
  transformations: boolean;
  lineage: boolean;
}

export const DataCurationPanel: React.FC<DataCurationPanelProps> = ({
  dataset,
  onDatasetUpdate
}) => {
  const loadSavedStates = (): AccordionStates => {
    const saved = localStorage.getItem('dataCurationAccordionStates');
    return saved ? JSON.parse(saved) : {
      quality: false,
      transformations: false,
      lineage: false
    };
  };

  const [accordionStates, setAccordionStates] = useState<AccordionStates>(loadSavedStates());

  useEffect(() => {
    localStorage.setItem('dataCurationAccordionStates', JSON.stringify(accordionStates));
  }, [accordionStates]);

  const toggleAccordion = (section: keyof AccordionStates) => {
    setAccordionStates((prev: AccordionStates) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const calculateQualityMetrics = () => {
    const metrics = {
      completeness: 0,
      uniqueness: 0,
      outliers: 0
    };
    
    if (!dataset.values.length) return metrics;
    
    // Calculate completeness
    const totalFields = Object.keys(dataset.values[0]).length * dataset.values.length;
    const nonNullFields = dataset.values.reduce((acc, row) => {
      return acc + Object.values(row).filter(v => v != null).length;
    }, 0);
    metrics.completeness = Math.round((nonNullFields / totalFields) * 100);

    // Calculate uniqueness
    const uniqueRows = new Set(dataset.values.map(row => JSON.stringify(row))).size;
    metrics.uniqueness = Math.round((uniqueRows / dataset.values.length) * 100);

    // Detect outliers in numeric columns
    const numericColumns = Object.entries(dataset.dataTypes || {})
      .filter(([_, type]) => type === 'quantitative')
      .map(([field]) => field);

    let outlierCount = 0;
    numericColumns.forEach(column => {
      const values = dataset.values.map(row => row[column]).filter(v => !isNaN(v));
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
      outlierCount += values.filter(v => Math.abs(v - mean) > 3 * std).length;
    });
    metrics.outliers = outlierCount;

    return metrics;
  };

  const metrics = calculateQualityMetrics();

  const handleCleanData = () => {
    const cleanedData = {
      ...dataset,
      values: dataset.values.map(row => {
        const cleaned = { ...row };
        Object.entries(cleaned).forEach(([key, value]) => {
          // Remove leading/trailing whitespace from strings
          if (typeof value === 'string') {
            cleaned[key] = value.trim();
          }
          // Convert empty strings to null
          if (value === '') {
            cleaned[key] = null;
          }
        });
        return cleaned;
      })
    };
    onDatasetUpdate(cleanedData);
  };

  return (
    <Panel>
      <Accordion>
        <AccordionHeader 
          onClick={() => toggleAccordion('quality')}
          $isOpen={accordionStates.quality}
        >
          Data Quality
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </AccordionHeader>
        <AccordionContent $isOpen={accordionStates.quality}>
          <MetricCard>
            <MetricValue>{metrics.completeness}%</MetricValue>
            <MetricLabel>Data Completeness</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{metrics.uniqueness}%</MetricValue>
            <MetricLabel>Row Uniqueness</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{metrics.outliers}</MetricValue>
            <MetricLabel>Potential Outliers</MetricLabel>
          </MetricCard>
          <ActionButton onClick={handleCleanData}>
            Clean Data
          </ActionButton>
        </AccordionContent>
      </Accordion>

      <Accordion>
        <AccordionHeader 
          onClick={() => toggleAccordion('transformations')}
          $isOpen={accordionStates.transformations}
        >
          Suggested Transformations
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </AccordionHeader>
        <AccordionContent $isOpen={accordionStates.transformations}>
          {Object.entries(dataset.dataTypes || {}).map(([field, type]) => (
            <MetricCard key={field}>
              <MetricLabel>{field}</MetricLabel>
              {type === 'quantitative' && (
                <ActionButton onClick={() => {
                  const transformed = {
                    ...dataset,
                    values: dataset.values.map(row => ({
                      ...row,
                      [`${field}_log`]: Math.log(Math.max(row[field], 1))
                    }))
                  };
                  onDatasetUpdate(transformed);
                }}>
                  Add Log Transform
                </ActionButton>
              )}
            </MetricCard>
          ))}
        </AccordionContent>
      </Accordion>

      <Accordion>
        <AccordionHeader 
          onClick={() => toggleAccordion('lineage')}
          $isOpen={accordionStates.lineage}
        >
          Data Lineage
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </AccordionHeader>
        <AccordionContent $isOpen={accordionStates.lineage}>
          <MetricCard>
            <MetricLabel>Original Source</MetricLabel>
            <MetricValue>{dataset.source || 'Unknown'}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Last Modified</MetricLabel>
            <MetricValue>
              {dataset.uploadDate ? new Date(dataset.uploadDate).toLocaleString() : 'Unknown'}
            </MetricValue>
          </MetricCard>
        </AccordionContent>
      </Accordion>
    </Panel>
  );
}; 