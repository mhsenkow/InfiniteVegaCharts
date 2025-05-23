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
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DirectionsIcon from '@mui/icons-material/Directions';
import { validateDataset } from '../../utils/dataUtils';
import { ImageDataExtractor } from './ImageDataExtractor';
import { ExportImport } from './ExportImport';
import { updateSampleDatasets } from '../../utils/seedData';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';

const Container = styled.div`
  padding: 32px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${props => props.theme.text.primary};
  font-weight: 600;
  font-size: 2rem;
`;

const DatasetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 32px;
`;

const DatasetCard = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 20px;
  margin-bottom: 8px;
  border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 12px;
  background: ${props => props.$active ? `${props.theme.colors.primary}10` : props.theme.colors.surface};
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
`;

const DatasetCardTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: ${props => props.theme.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const DatasetCardStats = styled.div`
  font-size: 0.95rem;
  color: ${props => props.theme.text.secondary};
  margin-bottom: 4px;
  display: flex;
  gap: 8px;
  align-items: center;
`;

const DatasetCardMeta = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.text.tertiary};
`;

const DatasetCardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid ${props => props.theme.colors.border}40;
`;

const DatasetCardActions = styled.div`
  display: flex;
  gap: 8px;
`;

const DatasetCardAction = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${props => props.theme.text.secondary};
  display: flex;
  align-items: center;
  border-radius: 4px;
  
  &:hover {
    background: ${props => props.theme.colors.border}30;
    color: ${props => props.theme.colors.primary};
  }
`;

const EmptyState = styled.div`
  padding: 36px;
  text-align: center;
  background: #f8f9fa;
  border-radius: 8px;
  color: ${props => props.theme.text.secondary};
  margin-top: 24px;
  font-size: 1.1rem;
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
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 24px;
  
  th, td {
    padding: 16px;
    text-align: left;
  }
  
  th {
    background: #f8f9fa;
    font-weight: 500;
    color: ${props => props.theme.text.secondary};
    border-bottom: 2px solid ${props => props.theme.colors.border};
    position: sticky;
    top: 0;
  }
  
  tr {
    transition: all 0.2s ease;
  }
  
  tbody tr:hover {
    background: rgba(0, 0, 0, 0.02);
  }
  
  td {
    border-bottom: 1px solid ${props => props.theme.colors.border}40;
  }
  
  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const TableActions = styled.div`
  display: flex;
  gap: 8px;
`;

const TableAction = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  color: ${props => props.theme.text.secondary};
  
  &:hover {
    background: ${props => props.theme.colors.border}30;
    color: ${props => props.theme.colors.primary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  padding: 6px 12px;
  border: 1px solid ${props => props.theme.colors.error};
  border-radius: 4px;
  background: white;
  color: ${props => props.theme.colors.error};
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${props => props.theme.colors.error}10;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

// Add styling for sample dataset indicators
const SampleTag = styled(Chip)`
  font-size: 0.7rem;
  height: 20px;
  margin-left: 8px;
  background-color: #e3f2fd;
  color: #0d47a1;
`;

// Add styling for transformed dataset indicators
const TransformedTag = styled(Chip)`
  font-size: 0.7rem;
  height: 20px;
  margin-left: 8px;
  background-color: #f0f4c3;
  color: #33691e;
`;

// New styled component for action buttons
const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

// Props interface for DataManagement
interface DataManagementProps {
  isDbSeeded?: boolean;
}

export const DataManagement: React.FC<DataManagementProps> = ({ isDbSeeded }) => {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<DatasetMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<'datasets' | 'transform' | 'image' | 'exportimport'>('datasets');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [error, setError] = useState<string | null>(null);
  const [showRefreshMessage, setShowRefreshMessage] = useState(false);

  useEffect(() => {
    // Show refresh message when database is seeded for the first time
    if (isDbSeeded) {
      setShowRefreshMessage(true);
      setTimeout(() => setShowRefreshMessage(false), 5000);
    }
    
    loadDatasets();
  }, [isDbSeeded]);

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
      // Don't allow deletion of sample datasets
      const datasetToDelete = datasets.find(d => d.id === id);
      if (datasetToDelete?.isSample) {
        alert("Sample datasets cannot be deleted. You can modify them instead.");
        return;
      }
      
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
    if (dataset.values && !validateDataset(dataset.values)) {
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

  const handleUpdateSampleDatasets = async () => {
    try {
      setLoading(true);
      await updateSampleDatasets();
      await loadDatasets();
      setLoading(false);
    } catch (error) {
      setError('Failed to update sample datasets');
      setLoading(false);
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
          <Tooltip title="Update sample datasets to latest versions">
            <Tab 
              $active={false}
              onClick={handleUpdateSampleDatasets}
            >
              <AutoFixHighIcon fontSize="small" />
              Update Samples
            </Tab>
          </Tooltip>
        </TabContainer>
      </TopBar>

      {error && (
        <ErrorMessage>
          <span>⚠️</span>
          <span>{error}</span>
        </ErrorMessage>
      )}

      {showRefreshMessage && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: '#e6f7ff',
          borderRadius: '4px',
          border: '1px solid #91d5ff'
        }}>
          Sample datasets have been loaded! You can now use them for creating visualizations.
        </div>
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
                    <DatasetCardTitle>
                      {dataset.name}
                      {dataset.isSample && (
                        <SampleTag size="small" label="Sample" />
                      )}
                      {dataset.transformed && (
                        <TransformedTag size="small" label="Transformed" />
                      )}
                    </DatasetCardTitle>
                    
                    <DatasetCardStats>
                      <strong>{dataset.values?.length || 0}</strong> rows × <strong>{dataset.columns?.length || 0}</strong> columns
                    </DatasetCardStats>
                    
                    <DatasetCardMeta>
                      {dataset.isSample 
                        ? 'Sample Dataset' 
                        : `Uploaded: ${dataset.uploadDate ? new Date(dataset.uploadDate).toLocaleDateString() : 'Unknown'}`
                      }
                    </DatasetCardMeta>
                    
                    <DatasetCardFooter>
                      <DatasetCardActions>
                        <Tooltip title="Transform Dataset">
                          <DatasetCardAction onClick={(e) => {
                            e.stopPropagation();
                            handleDatasetSelect(dataset);
                          }}>
                            <DirectionsIcon fontSize="small" />
                          </DatasetCardAction>
                        </Tooltip>
                        
                        <Tooltip title={dataset.isSample ? "Sample datasets cannot be deleted" : "Delete dataset"}>
                          <DatasetCardAction 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!dataset.isSample) handleDeleteDataset(dataset.id || '');
                            }}
                            style={{ opacity: dataset.isSample ? 0.5 : 1 }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </DatasetCardAction>
                        </Tooltip>
                      </DatasetCardActions>
                    </DatasetCardFooter>
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
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map(dataset => (
                    <tr 
                      key={dataset.id}
                      onClick={() => handleDatasetSelect(dataset)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <DatasetCardTitle style={{ fontSize: '1rem' }}>
                          {dataset.name}
                          {dataset.isSample && (
                            <SampleTag size="small" label="Sample" />
                          )}
                          {dataset.transformed && (
                            <TransformedTag size="small" label="Transformed" />
                          )}
                        </DatasetCardTitle>
                      </td>
                      <td><strong>{dataset.values?.length || 0}</strong></td>
                      <td><strong>{dataset.columns?.length || 0}</strong></td>
                      <td>{dataset.uploadDate ? new Date(dataset.uploadDate).toLocaleDateString() : 'Unknown'}</td>
                      <td>{dataset.isSample ? 'Sample' : 'User'}</td>
                      <td>
                        <TableActions>
                          <Tooltip title="Transform Dataset">
                            <TableAction onClick={(e) => {
                              e.stopPropagation();
                              handleDatasetSelect(dataset);
                            }}>
                              <DirectionsIcon fontSize="small" />
                            </TableAction>
                          </Tooltip>
                          
                          <Tooltip title={dataset.isSample ? "Sample datasets cannot be deleted" : "Delete dataset"}>
                            <TableAction 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!dataset.isSample) handleDeleteDataset(dataset.id || '');
                              }}
                              disabled={dataset.isSample}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </TableAction>
                          </Tooltip>
                        </TableActions>
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