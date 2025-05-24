import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Box, Typography, Tabs, Tab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import StorageIcon from '@mui/icons-material/Storage';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ImageIcon from '@mui/icons-material/Image';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TableChartIcon from '@mui/icons-material/TableChart';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DirectionsIcon from '@mui/icons-material/Directions';
import { DataAssetBrowser } from './DataAssetBrowser';
import { ImageDataExtractor } from './ImageDataExtractor';
import { DataTransformationPanel } from './DataTransformationPanel';
import { ExportImport } from './ExportImport';
import { storeDataset } from '../../utils/indexedDB';
import { exportAllData } from '../../utils/exportImport';
import { DataUploader } from '../Editor/DataUploader';
import { detectDataTypes, determineCompatibleCharts } from '../../utils/dataUtils';
import { DatasetMetadata } from '../../types/dataset';
import { updateSampleDatasets } from '../../utils/seedData';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const TabPanel = styled.div<{ $active: boolean }>`
  display: ${props => props.$active ? 'block' : 'none'};
  padding: 16px 0;
`;

const ActionButton = styled(Button)`
  margin-left: 8px;
`;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dataset-tabpanel-${index}`}
      aria-labelledby={`dataset-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export const DatasetManagementPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDataset, setSelectedDataset] = useState<DatasetMetadata | null>(null);
  const [isUpdatingSamples, setIsUpdatingSamples] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExportAllData = async () => {
    try {
      await exportAllData();
      setSuccessMessage("Data exported successfully!");
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleDatasetAdd = async (dataset: DatasetMetadata) => {
    try {
      await storeDataset(dataset);
      // Trigger refresh of data assets browser
      setRefreshTrigger(prev => prev + 1);
      setSuccessMessage("Dataset added successfully!");
    } catch (error) {
      console.error('Failed to store dataset:', error);
      alert('Failed to store dataset. Please try again.');
    }
  };

  const handleDatasetSelect = (dataset: DatasetMetadata) => {
    setSelectedDataset(dataset);
    setTabValue(4); // Switch to transform tab
  };

  const handleTransformComplete = () => {
    setSelectedDataset(null);
    setTabValue(0); // Back to browse tab
    setRefreshTrigger(prev => prev + 1);
    setSuccessMessage("Dataset transformed successfully!");
  };

  const handleImageDataExtracted = async (dataset: DatasetMetadata) => {
    try {
      await storeDataset(dataset);
      setRefreshTrigger(prev => prev + 1);
      setSuccessMessage("Data extracted from image successfully!");
    } catch (error) {
      console.error('Failed to save extracted dataset:', error);
      alert('Failed to save extracted dataset. Please try again.');
    }
  };

  const handleUpdateSampleDatasets = async () => {
    try {
      setIsUpdatingSamples(true);
      await updateSampleDatasets();
      setRefreshTrigger(prev => prev + 1);
      setSuccessMessage("Sample datasets updated successfully!");
    } catch (error) {
      console.error('Failed to update sample datasets:', error);
      alert('Failed to update sample datasets. Please try again.');
    } finally {
      setIsUpdatingSamples(false);
    }
  };

  return (
    <PageContainer>
      <Header>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Data Asset Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse, manage, and organize your datasets
          </Typography>
        </Box>
        <Box>
          <ActionButton 
            variant="outlined" 
            onClick={handleUpdateSampleDatasets}
            startIcon={<AutoFixHighIcon />}
            disabled={isUpdatingSamples}
          >
            {isUpdatingSamples ? 'Updating...' : 'Update Sample Data'}
          </ActionButton>
          <ActionButton 
            variant="outlined" 
            onClick={handleExportAllData}
            startIcon={<StorageIcon />}
          >
            Export All Data
          </ActionButton>
        </Box>
      </Header>

      {successMessage && (
        <Box sx={{ 
          p: 2, 
          mb: 2,
          bgcolor: '#e8f5e9', 
          borderRadius: 1,
          border: '1px solid #c8e6c9'
        }}>
          <Typography color="#2e7d32">{successMessage}</Typography>
        </Box>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dataset management tabs">
          <Tab icon={<TableChartIcon />} iconPosition="start" label="Browse Datasets" />
          <Tab icon={<UploadFileIcon />} iconPosition="start" label="Upload Dataset" />
          <Tab icon={<ImageIcon />} iconPosition="start" label="Image Extraction" />
          <Tab icon={<CloudUploadIcon />} iconPosition="start" label="Export/Import" />
          {selectedDataset && (
            <Tab icon={<DirectionsIcon />} iconPosition="start" label="Transform" />
          )}
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <Box sx={{ mt: 2 }}>
          <DataAssetBrowser 
            key={`browser-${refreshTrigger}`} 
            onSelectDataset={handleDatasetSelect}
          />
        </Box>
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={1}>
        <Box sx={{ mt: 2, p: 3, border: '1px solid #eee', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Upload New Dataset
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload CSV or JSON data. You'll be prompted to add metadata to help organize and identify your dataset.
          </Typography>
          
          <DataUploader 
            onDatasetAdd={handleDatasetAdd}
            detectDataTypes={detectDataTypes}
            determineCompatibleCharts={determineCompatibleCharts}
          />
        </Box>
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={2}>
        <Box sx={{ mt: 2 }}>
          <ImageDataExtractor onDataExtracted={handleImageDataExtracted} />
        </Box>
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={3}>
        <Box sx={{ mt: 2 }}>
          <ExportImport />
        </Box>
      </CustomTabPanel>

      {selectedDataset && (
        <CustomTabPanel value={tabValue} index={4}>
          <Box sx={{ mt: 2 }}>
            <DataTransformationPanel 
              dataset={selectedDataset}
              onComplete={handleTransformComplete}
            />
          </Box>
        </CustomTabPanel>
      )}
    </PageContainer>
  );
}; 