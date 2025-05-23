import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DatasetMetadata } from '../../types/dataset';
import { getAllDatasets, deleteDataset, storeDataset } from '../../utils/indexedDB';
import { DatasetSection } from '../Editor/DatasetSection';
import { DataTransformationPanel } from './DataTransformationPanel';
import { LoadingState } from '../common/LoadingState';
import TableViewIcon from '@mui/icons-material/TableView';
import GridViewIcon from '@mui/icons-material/GridView';
import ImageIcon from '@mui/icons-material/Image';
import BackupIcon from '@mui/icons-material/Backup';
import { validateDataset } from '../../utils/dataUtils';
import { ImageDataExtractor } from './ImageDataExtractor';
import { ExportImport } from './ExportImport';

const Container = styled.div`
  padding: 24px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${props => props.theme.text.primary};
`;

const DatasetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
`;

const DatasetCard = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 8px;
  background: ${props => props.$active ? `${props.theme.colors.primary}10` : props.theme.colors.surface};
  text-align: left;
  cursor: pointer;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: ${props => props.theme.text.secondary};
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed ${props => props.theme.colors.border};
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  background: ${props => props.$active ? props.theme.colors.primary : 'white'};
  color: ${props => props.$active ? 'white' : props.theme.text.primary};
  border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ViewToggle = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.text.primary};
  font-size: 1.5rem;
`;

const DatasetTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 24px;

  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    background: #f8f9fa;
    font-weight: 500;
  }

  tbody tr:hover {
    background: #f8f9fa;
  }
`;

const DeleteButton = styled.button`
  padding: 6px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s ease;
  
  &:hover {
    background: #c82333;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background-color: #f8d7da;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const DataManagement = () => {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<DatasetMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<'datasets' | 'transform' | 'image' | 'exportimport'>('datasets');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllDatasets();
      setDatasets(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load datasets';
      console.error('Failed to load datasets:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDataset = async (id: string) => {
    try {
      setError(null);
      await deleteDataset(id);
      await loadDatasets();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete dataset';
      console.error('Failed to delete dataset:', error);
      setError(errorMessage);
    }
  };

  const handleDatasetSelect = (dataset: DatasetMetadata) => {
    // Validate dataset before selecting
    if (!validateDataset(dataset.values)) {
      setError("Invalid dataset: Data structure is inconsistent or corrupted.");
      return;
    }
    
    setError(null);
    setSelectedDataset(dataset);
    setActiveTab('transform');
  };

  const handleImageDataExtracted = async (dataset: DatasetMetadata) => {
    try {
      await storeDataset(dataset);
      await loadDatasets();
      setError(null);
      // Show success message or feedback
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save extracted dataset';
      console.error('Failed to save extracted dataset:', error);
      setError(errorMessage);
    }
  };

  const handleTransformComplete = () => {
    setSelectedDataset(null);
    setActiveTab('datasets');
    loadDatasets();
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Container>
      <TopBar>
        <Title>Data Management</Title>
        <TabContainer>
          <ViewToggle onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}>
            {viewMode === 'grid' ? <TableViewIcon /> : <GridViewIcon />}
          </ViewToggle>
          <Tab 
            $active={activeTab === 'datasets'} 
            onClick={() => setActiveTab('datasets')}
          >
            Datasets
          </Tab>
          <Tab 
            $active={activeTab === 'image'} 
            onClick={() => setActiveTab('image')}
          >
            <ImageIcon fontSize="small" />
            Image Extraction
          </Tab>
          <Tab 
            $active={activeTab === 'exportimport'} 
            onClick={() => setActiveTab('exportimport')}
          >
            <BackupIcon fontSize="small" />
            Export/Import
          </Tab>
          <Tab 
            $active={activeTab === 'transform'} 
            onClick={() => setActiveTab('transform')}
            disabled={!selectedDataset}
          >
            Transform
          </Tab>
        </TabContainer>
      </TopBar>

      {error && (
        <ErrorMessage>
          <span>⚠️</span>
          <span>{error}</span>
        </ErrorMessage>
      )}

      {activeTab === 'datasets' && (
        <>
          <DatasetSection onDatasetLoad={loadDatasets} />
          
          {datasets.length > 0 ? (
            viewMode === 'grid' ? (
              <DatasetGrid>
                {datasets.map(dataset => (
                  <DatasetCard 
                    key={dataset.id}
                    onClick={() => handleDatasetSelect(dataset)}
                    $active={selectedDataset?.id === dataset.id}
                  >
                    <h3>{dataset.name}</h3>
                    <p>{dataset.values?.length || 0} rows × {dataset.columns?.length || 0} columns</p>
                    <p>Uploaded: {dataset.uploadDate ? new Date(dataset.uploadDate).toLocaleDateString() : 'Unknown'}</p>
                  </DatasetCard>
                ))}
              </DatasetGrid>
            ) : (
              <DatasetTable>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Rows</th>
                    <th>Columns</th>
                    <th>Upload Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map(dataset => (
                    <tr key={dataset.id}>
                      <td>{dataset.name}</td>
                      <td>{dataset.values?.length || 0}</td>
                      <td>{dataset.columns?.length || 0}</td>
                      <td>{dataset.uploadDate ? new Date(dataset.uploadDate).toLocaleDateString() : 'Unknown'}</td>
                      <td>
                        <DeleteButton onClick={() => handleDeleteDataset(dataset.id || '')}>Delete</DeleteButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DatasetTable>
            )
          ) : (
            <EmptyState>
              No datasets uploaded yet. Upload your first dataset to get started.
            </EmptyState>
          )}
        </>
      )}

      {activeTab === 'image' && (
        <ImageDataExtractor onDataExtracted={handleImageDataExtracted} />
      )}

      {activeTab === 'transform' && selectedDataset && (
        <DataTransformationPanel 
          dataset={selectedDataset}
          onComplete={handleTransformComplete}
        />
      )}

      {activeTab === 'exportimport' && (
        <ExportImport />
      )}
    </Container>
  );
};

export default DataManagement; 