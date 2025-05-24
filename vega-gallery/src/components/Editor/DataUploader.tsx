import { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse'; // For CSV parsing
import { DatasetMetadata, DataAsset } from '../../types/dataset';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { generatePreviewRows, enhanceDatasetMetadata, generateDataFingerprint, createDataSample, processInChunks } from '../../utils/dataUtils';
import { DatasetMetadataForm } from '../DataManagement/DatasetMetadataForm';
import { LinearProgress, Typography, Box } from '@mui/material';

interface DataUploaderProps {
  onDatasetAdd: (dataset: DatasetMetadata) => void;
  detectDataTypes: (values: any[]) => Record<string, string>;
  determineCompatibleCharts: (metadata: DatasetMetadata) => string[];
}

const UploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: #f0f0f0;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #e4e4e4;
  }
`;

const DropArea = styled.div<{ $isDragging: boolean }>`
  padding: 32px;
  border: 2px dashed ${props => props.$isDragging ? '#4dabf7' : '#ddd'};
  border-radius: 8px;
  margin: 16px 0;
  text-align: center;
  transition: all 0.2s;
  background-color: ${props => props.$isDragging ? 'rgba(77, 171, 247, 0.1)' : '#f8f9fa'};
  
  &:hover {
    border-color: var(--color-primary);
    background-color: rgba(77, 171, 247, 0.1);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const StatusText = styled.div`
  margin-top: 16px;
  font-size: 0.9rem;
  color: #555;
`;

export const DataUploader: React.FC<DataUploaderProps> = ({ 
  onDatasetAdd, 
  detectDataTypes,
  determineCompatibleCharts 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [uploadedData, setUploadedData] = useState<{
    values: any[];
    fullDataset: any[];
    columns: string[];
    originalFileName: string;
    totalRowCount?: number;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Define a constant for chunk size limits
  const MAX_CHUNK_COLLECT = 500000; // Collect up to 500K rows before stopping
  const MAX_ROWS_TO_KEEP = 100000; // Keep only this many rows in memory for preview

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsLoading(true);
    setUploadStatus('Reading file...');
    setProgress(10);

    try {
      // Check file size - show warning for large files
      const isLargeFile = file.size > 10 * 1024 * 1024; // > 10MB
      if (isLargeFile) {
        setUploadStatus('Large file detected. Processing may take a while...');
      }
      
      // Parse CSV or JSON
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        parseCSV(file);
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        parseJSON(file);
      } else {
        setUploadStatus('Unsupported file format. Please upload CSV or JSON.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to process file:', error);
      setUploadStatus('Error processing file. Please try again.');
      setIsLoading(false);
    }
  };

  const parseCSV = (file: File) => {
    // For large files, we'll collect chunks manually
    let allData: any[] = [];
    let fields: string[] = [];
    let rowCount = 0; // Track total row count even if we don't keep all rows
    let isExtremelyLarge = false;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      chunk: (results, parser) => {
        // This is called for each chunk of data (for large files)
        const chunkProgress = results.meta.cursor / file.size;
        setProgress(10 + chunkProgress * 60); // Scale to 10-70% of our progress bar
        
        // Capture field names from the first chunk if not already captured
        if (!fields.length && results.meta.fields && results.meta.fields.length > 0) {
          fields = results.meta.fields;
        }
        
        // Collect data from each chunk
        if (results.data && Array.isArray(results.data) && results.data.length > 0) {
          rowCount += results.data.length;
          
          // For extremely large files, only keep a subset of rows for preview
          if (allData.length < MAX_ROWS_TO_KEEP) {
            // If we haven't reached the preview limit, add all rows
            if (allData.length + results.data.length <= MAX_ROWS_TO_KEEP) {
              allData = [...allData, ...results.data];
            } else {
              // Add only enough rows to reach the preview limit
              const rowsToAdd = MAX_ROWS_TO_KEEP - allData.length;
              allData = [...allData, ...results.data.slice(0, rowsToAdd)];
              
              console.log(`Collected ${MAX_ROWS_TO_KEEP} rows for preview, continuing to count total rows`);
            }
          }
          
          if (rowCount % 50000 === 0) {
            console.log(`Processed ${rowCount} rows so far`);
            setUploadStatus(`Processing large CSV: ${rowCount.toLocaleString()} rows so far...`);
          }
          
          // For extremely large files, we'll just count rows but not store all data
          if (rowCount > MAX_CHUNK_COLLECT && !isExtremelyLarge) {
            isExtremelyLarge = true;
            console.log(`File is extremely large (${rowCount} rows). Continuing to count rows but not storing all data.`);
            // Keep a random sample of the data we've seen so far for analysis
            allData = createDataSample(allData, MAX_ROWS_TO_KEEP);
          }
        }
      },
      complete: async (results) => {
        setUploadStatus('Processing data...');
        setProgress(70);
        
        try {
          // For extremely large files, we use the allData array as a sample
          // For smaller files, use results.data directly
          let fullDataset: any[] = [];
          
          if (rowCount > 0) {
            // We collected data in chunks
            fullDataset = allData;
            
            // If the file is extremely large, make this clear to the user
            if (isExtremelyLarge) {
              console.log(`Using a sample of ${fullDataset.length} rows from extremely large dataset (${rowCount} total rows)`);
              setUploadStatus(`Preparing sample of ${fullDataset.length.toLocaleString()} rows from ${rowCount.toLocaleString()} total rows`);
            } else {
              console.log(`Using ${fullDataset.length} rows collected from chunks`);
            }
          } else if (results.data && Array.isArray(results.data)) {
            // Small file, use results.data directly
            fullDataset = results.data;
            rowCount = results.data.length;
            fields = results.meta.fields || [];
            console.log(`Using ${fullDataset.length} rows from complete callback`);
          } else {
            throw new Error('No valid data found in CSV file');
          }
          
          if (fullDataset.length === 0) {
            throw new Error('CSV file contains no valid data rows');
          }
          
          // Process the collected data
          finalizeData(fullDataset, fields, file.name, rowCount);
        } catch (error) {
          console.error('Error processing CSV data:', error);
          setUploadStatus(`Error processing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsLoading(false);
          setProgress(100);
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        setUploadStatus(`Error parsing CSV: ${error.message || 'Please check the file format.'}`);
        setIsLoading(false);
      }
    });
  };
  
  // Helper function to process the final dataset once parsing is complete
  const finalizeData = (fullDataset: any[], fields: string[], fileName: string, totalRowCount?: number) => {
    try {
      const displayRowCount = totalRowCount || fullDataset.length;
      console.log(`Finalizing dataset with ${displayRowCount} rows and ${fields.length} columns`);
      
      // Create sample for UI and preview
      const sampleData = createDataSample(fullDataset, 1000);
      
      setUploadedData({
        values: sampleData,
        fullDataset: fullDataset,
        columns: fields,
        originalFileName: fileName,
        totalRowCount: totalRowCount // Store the total row count if available
      });
      
      setProgress(90);
      setUploadStatus(`Ready to add metadata for ${displayRowCount.toLocaleString()} rows`);
      setShowMetadataForm(true);
    } catch (error) {
      console.error('Error finalizing data:', error);
      setUploadStatus(`Error finalizing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  const parseJSON = async (file: File) => {
    try {
      setUploadStatus('Reading JSON file...');
      const text = await file.text();
      setProgress(40);
      
      setUploadStatus('Parsing JSON data...');
      let json;
      
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error(`Failed to parse JSON: ${parseError instanceof Error ? parseError.message : 'Invalid JSON format'}`);
      }
      
      setProgress(60);
      setUploadStatus('Processing JSON data...');
      
      // Handle different JSON formats
      let data: any[] = [];
      
      if (Array.isArray(json)) {
        data = json;
        console.log(`JSON contains array with ${data.length} items`);
      } else if (json.data && Array.isArray(json.data)) {
        data = json.data;
        console.log(`JSON contains data property with array of ${data.length} items`);
      } else if (typeof json === 'object') {
        // Try to extract array from nested object
        console.log('JSON is an object, searching for arrays within it');
        const possibleArrays = Object.entries(json)
          .filter(([_, value]) => Array.isArray(value) && (value as any[]).length > 0)
          .map(([key, value]) => ({ key, array: value as any[], length: (value as any[]).length }));
        
        if (possibleArrays.length > 0) {
          // Sort by array length to find the largest
          possibleArrays.sort((a, b) => b.length - a.length);
          const largest = possibleArrays[0];
          console.log(`Found ${possibleArrays.length} arrays in JSON, using "${largest.key}" with ${largest.length} items`);
          data = largest.array;
        } else {
          console.log('No valid arrays found in JSON object');
        }
      }
      
      if (data.length === 0) {
        throw new Error('No valid data array found in JSON');
      }
      
      // For extremely large datasets, enforce a limit
      const MAX_ROWS = 1000000; // 1 million rows
      if (data.length > MAX_ROWS) {
        console.warn(`JSON contains ${data.length} rows, limiting to ${MAX_ROWS} for performance`);
        data = data.slice(0, MAX_ROWS);
      }
      
      // Process the extracted data
      finalizeData(data, data.length > 0 ? Object.keys(data[0]) : [], file.name);
    } catch (error) {
      console.error('JSON processing error:', error);
      setUploadStatus(`Error processing JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
      setProgress(100);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleMetadataSubmit = async (metadata: Partial<DataAsset>) => {
    if (!uploadedData) return;
    
    setIsLoading(true);
    setUploadStatus('Finalizing dataset...');
    setProgress(10);
    
    try {
      // For large datasets, log size information
      const actualRowCount = uploadedData.totalRowCount || uploadedData.fullDataset.length;
      console.log(`Processing dataset with ${actualRowCount} rows and ${uploadedData.columns.length} columns`);
      
      // Process the full dataset in chunks to avoid UI freezing
      let fingerprint = '';
      
      // Generate fingerprint from sample
      setUploadStatus('Generating data fingerprint from sample...');
      // Use a smaller sample size for very large datasets
      const sampleSize = Math.min(5000, Math.max(1000, Math.floor(uploadedData.fullDataset.length * 0.05)));
      const sample = createDataSample(uploadedData.fullDataset, sampleSize);
      fingerprint = await generateDataFingerprint(sample);
      console.log(`Generated fingerprint from sample of ${sampleSize} rows`);
      
      setProgress(40);
      setUploadStatus('Analyzing data types...');
      
      // Detect data types from sample
      const dataTypes = detectDataTypes(uploadedData.values);
      
      // Generate preview rows from sample
      const previewRows = generatePreviewRows(uploadedData.values);
      
      setProgress(70);
      setUploadStatus('Creating dataset record...');
      
      // We're already using a sample for extremely large datasets
      let processedDataset: any[] = uploadedData.fullDataset;
      
      // Create dataset with enhanced metadata
      const dataset: DatasetMetadata = {
        id: uuidv4(),
        name: metadata.name || uploadedData.originalFileName,
        description: metadata.description || '',
        tags: metadata.tags || [],
        origin: metadata.origin || 'manual upload',
        source: metadata.source || 'file upload',
        createdAt: new Date().toISOString(),
        values: processedDataset, // Store the processed dataset
        columns: uploadedData.columns,
        dataTypes: dataTypes,
        fieldTypes: metadata.fieldTypes || {},
        rowCount: actualRowCount, // Use the actual row count, not just the sample
        columnCount: uploadedData.columns.length,
        fingerprint: fingerprint,
        previewRows: previewRows,
        isSampled: uploadedData.totalRowCount !== undefined && uploadedData.totalRowCount > processedDataset.length
      };
      
      // Add any additional metadata
      setUploadStatus('Enhancing dataset metadata...');
      const enhancedDataset = await enhanceDatasetMetadata(dataset, processedDataset);
      
      setProgress(90);
      setUploadStatus('Adding to library...');
      
      // Call the onDatasetAdd callback with the enhanced dataset
      onDatasetAdd(enhancedDataset);
      
      // Reset the uploader and clean up memory
      setUploadedData(null);
      setShowMetadataForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setProgress(100);
      setUploadStatus('Dataset added successfully!');
    } catch (error) {
      console.error('Failed to process dataset:', error);
      setUploadStatus(`Error processing dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelMetadata = () => {
    setUploadedData(null);
    setShowMetadataForm(false);
    setUploadStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      {!showMetadataForm && (
        <>
          <UploadButton>
            Choose File
            <HiddenInput 
              ref={fileInputRef}
              type="file" 
              accept=".csv,.json" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }} 
            />
          </UploadButton>
          
          <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
            or drop your file here
          </Typography>
          
          <DropArea 
            $isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Typography>
              Drag & Drop CSV or JSON file here
            </Typography>
          </DropArea>
        </>
      )}
      
      {isLoading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary">{`${Math.round(progress)}%`}</Typography>
            </Box>
          </Box>
          <StatusText>{uploadStatus}</StatusText>
        </Box>
      )}
      
      {showMetadataForm && uploadedData && (
        <DatasetMetadataForm
          initialMetadata={{
            name: uploadedData.originalFileName
          }}
          onSubmit={handleMetadataSubmit}
          onCancel={handleCancelMetadata}
          open={true}
          previewData={uploadedData.values.slice(0, 10)}
        />
      )}
    </div>
  );
};
