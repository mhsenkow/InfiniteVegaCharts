/**
 * Handles dataset selection and management.
 * Supports both sample and custom uploaded datasets.
 */

import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { sampleDatasets } from '../../utils/sampleData'
import { MarkType } from '../../types/vega'
import { DatasetMetadata } from '../../types/dataset'
import { LoadingState } from '../common/LoadingState'
import { Tabs, Tab } from '@mui/material'
import { getAllDatasets, initDB, deleteDataset, clearAllDatasets } from '../../utils/indexedDB'
import { DatasetSection } from './DatasetSection'
import { detectDataTypes, detectColumnType } from '../../utils/dataUtils'

const Container = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`

const DatasetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  flex: 1;
`

const DatasetCard = styled.div<{ $active: boolean }>`
  width: 100%;
  padding: 12px;
  background: var(--color-surface);
  border: 2px solid ${props => props.$active ? 'var(--color-primary)' : 'var(--color-border)'};
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:hover {
    border-color: var(--color-primary);
    background: ${props => props.$active ? 'var(--color-surface)' : 'var(--color-surface-hover)'};
  }
`

const DatasetCardButton = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 12px;
  background: var(--color-surface);
  border: 2px solid ${props => props.$active ? 'var(--color-primary)' : 'var(--color-border)'};
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--color-primary);
    background: ${props => props.$active ? 'var(--color-surface)' : 'var(--color-surface-hover)'};
  }
`

const DatasetName = styled.div`
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
`

const DatasetDescription = styled.div`
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
`

const DatasetMeta = styled.div`
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
`

const Badge = styled.span`
  padding: 2px 6px;
  background: var(--color-border);
  border-radius: 4px;
  font-size: 0.8rem;
`

const TabPanel = styled.div<{ $active: boolean }>`
  display: ${props => props.$active ? 'flex' : 'none'};
  flex-direction: column;
  padding: 16px 0;
  height: 100%;
  overflow: hidden;
  flex: 1;
  min-height: 0;
`

const DatasetControls = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 8px 16px;
`;

const ClearButton = styled.button`
  padding: 6px 12px;
  background: var(--color-error);
  color: var(--color-surface);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background: var(--color-error-dark, #c82333);
  }
`;

const DeleteButton = styled.button`
  padding: 4px 8px;
  background: none;
  border: none;
  color: var(--color-error);
  cursor: pointer;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
`;

const DatasetContent = styled.div`
  flex: 1;
  cursor: pointer;
`;

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
  </svg>
);

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px dashed var(--color-border);
`;

interface DatasetSelectorProps {
  chartId: string;
  currentDataset: string;
  onSelect: (datasetId: any) => void;
  allowUpload?: boolean;
  datasetCache?: Record<string, DatasetMetadata>;
  setDatasetCache?: (cache: Record<string, DatasetMetadata>) => void;
}

export const DatasetSelector = ({ 
  chartId,
  currentDataset, 
  onSelect,
  allowUpload = false
}: DatasetSelectorProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [uploadedDatasets, setUploadedDatasets] = useState<DatasetMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize IndexedDB and load datasets
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize IndexedDB
        await initDB();
        
        // Get all datasets
        const datasets = await getAllDatasets();
        console.log('Loaded datasets:', datasets); // Debug log
        
        if (Array.isArray(datasets)) {
          setUploadedDatasets(datasets);
        } else {
          console.error('Invalid datasets format:', datasets);
          setUploadedDatasets([]);
        }
      } catch (error) {
        console.error('Failed to load datasets:', error);
        setError('Failed to load datasets. Please try again.');
        setUploadedDatasets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDatasets();
  }, []);

  const handleSelect = async (dataset: DatasetMetadata | string) => {
    try {
      onSelect(dataset);
    } catch (error) {
      console.error('Error selecting dataset:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDataset(id);
      // Refresh the dataset list
      const datasets = await getAllDatasets();
      setUploadedDatasets(datasets as DatasetMetadata[]);
    } catch (error) {
      console.error('Failed to delete dataset:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllDatasets();
      setUploadedDatasets([]);
    } catch (error) {
      console.error('Failed to clear datasets:', error);
    }
  };

  return (
    <Container>
      {error && (
        <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>
      )}
      
      {allowUpload && (
        <DatasetSection 
          onDatasetLoad={(dataset) => {
            // Refresh the dataset list after upload
            getAllDatasets().then(datasets => {
              if (Array.isArray(datasets)) {
                setUploadedDatasets(datasets);
              }
            });
            handleSelect(dataset);
          }}
        />
      )}
      
      <Tabs 
        value={activeTab} 
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Sample Data" />
        <Tab label="My Uploads" />
      </Tabs>

      <TabPanel $active={activeTab === 0}>
        <DatasetList>
          {Object.entries(sampleDatasets).map(([id, dataset]) => (
            <DatasetCardButton
              key={id}
              $active={currentDataset === id}
              onClick={() => handleSelect(id)}
            >
              <DatasetName>{dataset.name}</DatasetName>
              <DatasetDescription>{dataset.description}</DatasetDescription>
              <DatasetMeta>
                <Badge>Sample</Badge>
              </DatasetMeta>
            </DatasetCardButton>
          ))}
        </DatasetList>
      </TabPanel>

      <TabPanel $active={activeTab === 1}>
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            <DatasetControls>
              {uploadedDatasets.length > 0 && (
                <ClearButton onClick={handleClearAll}>
                  Clear All Datasets
                </ClearButton>
              )}
            </DatasetControls>
            <DatasetList>
              {uploadedDatasets.map(dataset => (
                <DatasetCard
                  key={dataset.id}
                  $active={currentDataset === dataset.id}
                >
                  <DatasetContent onClick={() => handleSelect(dataset)}>
                    <DatasetName>{dataset.name}</DatasetName>
                    <DatasetDescription>
                      {dataset.columns?.length || 0} columns
                    </DatasetDescription>
                    <DatasetMeta>
                      <Badge>Upload</Badge>
                      {dataset.transformed && (
                        <Badge className="transformed-badge">Transformed</Badge>
                      )}
                      {dataset.uploadDate && (
                        <span>{new Date(dataset.uploadDate).toLocaleDateString()}</span>
                      )}
                    </DatasetMeta>
                  </DatasetContent>
                  <DeleteButton onClick={(e) => {
                    e.stopPropagation();
                    if (dataset.id) {
                      handleDelete(dataset.id);
                    }
                  }}>
                    <TrashIcon />
                  </DeleteButton>
                </DatasetCard>
              ))}
              {uploadedDatasets.length === 0 && (
                <EmptyState>No uploaded datasets</EmptyState>
              )}
            </DatasetList>
          </>
        )}
      </TabPanel>
    </Container>
  );
} 