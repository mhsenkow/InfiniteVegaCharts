import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { createWorker } from 'tesseract.js';
import { Button, CircularProgress, Typography, Tabs, Tab, Box } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import CloudIcon from '@mui/icons-material/Cloud';
import TableChartIcon from '@mui/icons-material/TableChart';
import { DatasetMetadata } from '../../types/dataset';

// Import pdf-parse for PDF processing when in Electron environment
declare global {
  interface Window {
    electron?: {
      isElectron: boolean;
      processPdf: (filePath: string) => Promise<string>;
    };
  }
}

const Container = styled.div`
  background: var(--color-surface);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--color-border);
`;

const ImageUploadArea = styled.div<{ $isDragging: boolean }>`
  border: 2px dashed ${props => props.$isDragging ? 'var(--color-primary)' : 'var(--color-border)'};
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  margin-bottom: 24px;
  transition: all 0.2s ease;
  cursor: pointer;
  background: ${props => props.$isDragging ? `var(--color-primary)10` : '#f8f9fa'};
  
  &:hover {
    border-color: var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.1);
  }
`;

const ImagePreview = styled.div`
  max-width: 100%;
  max-height: 300px;
  margin: 16px auto;
  text-align: center;
  
  img {
    max-width: 100%;
    max-height: 300px;
    border-radius: 4px;
    border: 1px solid var(--color-border);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const ResultsContainer = styled.div`
  margin-top: 24px;
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
`;

const TabPanel = styled.div<{ $visible: boolean }>`
  display: ${props => props.$visible ? 'block' : 'none'};
  padding: 16px 0;
`;

const ResultPreview = styled.pre`
  max-height: 300px;
  overflow: auto;
  padding: 16px;
  background: var(--color-background);
  border-radius: 4px;
  border: 1px solid var(--color-border);
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ErrorMessage = styled.div`
  color: red;
  margin: 16px 0;
  padding: 8px 16px;
  background: #ffebee;
  border-radius: 4px;
  border-left: 4px solid #f44336;
`;

const StatusMessage = styled.div`
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
`;

const CloudApiKeyInput = styled.div`
  margin-bottom: 16px;
  
  input {
    width: 100%;
    padding: 8px;
    margin-top: 4px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }
`;

interface ImageDataExtractorProps {
  onDataExtracted: (dataset: DatasetMetadata) => void;
}

export const ImageDataExtractor: React.FC<ImageDataExtractorProps> = ({ onDataExtracted }) => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [extractionMethod, setExtractionMethod] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [extractedData, setExtractedData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [cloudApiKey, setCloudApiKey] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    // Reset previous results
    setExtractedText('');
    setExtractedData(null);
    setError(null);
    setStatusMessage('');
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, GIF, or PDF file.');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }
    
    setImage(file);
    setIsPdf(file.type === 'application/pdf');
    
    // Create preview URL (for images only)
    if (file.type !== 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDFs, just show a placeholder or PDF icon
      setImagePreviewUrl(null);
      setStatusMessage('PDF file loaded. Ready for processing.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      handleImageUpload(event.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setExtractionMethod(newValue);
  };

  // Process PDF content locally using pdf-parse via Electron's Node.js integration
  const processPdfLocally = async () => {
    if (!image || !isPdf) return;
    
    setIsProcessing(true);
    setStatusMessage('Processing PDF content...');
    setProgress(10);
    
    try {
      // Check if running in Electron environment
      const isElectron = window.electron?.isElectron;
      
      let pdfText = '';
      
      if (isElectron) {
        // If we're in Electron, we'll use the exposed API to process the PDF
        setStatusMessage('Processing PDF with Node.js (Electron)...');
        
        // Create a temporary file path
        const filePath = URL.createObjectURL(image);
        
        // Use the Electron bridge to process the PDF with pdf-parse
        pdfText = await window.electron.processPdf(filePath);
      } else {
        // If we're in the browser, we need to use a Web Worker
        setStatusMessage('Processing PDF in browser...');
        
        // Use dynamic import to load pdf-parse in browser context
        const pdfParse = await import('pdf-parse');
        
        // Read the file as ArrayBuffer
        const arrayBuffer = await image.arrayBuffer();
        
        // Parse the PDF content
        const data = await pdfParse.default(new Uint8Array(arrayBuffer));
        pdfText = data.text;
      }
      
      setProgress(80);
      setExtractedText(pdfText);
      
      // Try to convert the text to structured data
      const parsedData = parseExtractedText(pdfText);
      setExtractedData(parsedData);
      
      if (parsedData && parsedData.length > 0) {
        createDataset(parsedData);
      }
      
      setProgress(100);
    } catch (err) {
      console.error('PDF processing error:', err);
      setError(`Error processing PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processWithTesseract = async () => {
    if (!image) return;
    
    // If it's a PDF, use PDF-specific processing
    if (isPdf) {
      await processPdfLocally();
      return;
    }
    
    setIsProcessing(true);
    setStatusMessage('Initializing OCR engine...');
    setProgress(0);
    
    try {
      // In v5, createWorker is async and no need for initialize or loadLanguage steps
      const worker = await createWorker('eng');
      
      setStatusMessage('Processing image...');
      setProgress(50);
      
      // Recognize the image
      const { data } = await worker.recognize(image);
      setProgress(90);
      
      setExtractedText(data.text);
      
      // Try to convert the text to structured data
      const parsedData = parseExtractedText(data.text);
      setExtractedData(parsedData);
      
      if (parsedData && parsedData.length > 0) {
        createDataset(parsedData);
      }
      
      setProgress(100);
      await worker.terminate();
    } catch (err) {
      console.error('OCR processing error:', err);
      setError(`Error processing image: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const processWithCloudAPI = async () => {
    if (!image || !cloudApiKey) return;
    
    setIsProcessing(true);
    setStatusMessage('Sending image to Cloud Vision API...');
    setProgress(10);
    
    try {
      // Convert image to base64
      const base64Image = await fileToBase64(image);
      
      // API endpoint would be used in a production app
      // This is a mock implementation for demonstration
      setStatusMessage('Analyzing with Cloud Vision API...');
      setProgress(30);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(60);
      
      // In a real implementation, we would call:
      // const response = await fetch('https://vision.googleapis.com/v1/images:annotate?key=' + cloudApiKey, {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     requests: [{
      //       image: { content: base64Image.split(',')[1] },
      //       features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
      //     }]
      //   })
      // });
      // const responseData = await response.json();
      // const data = { 
      //   text: responseData.responses[0].fullTextAnnotation.text,
      //   // Cloud Vision API provides more detailed information that could be used  
      // };
      
      // For demo, simulate successful extraction
      setStatusMessage('Processing results...');
      setProgress(90);
      
      // Simulate API response
      const mockText = "Category,Value\nA,28\nB,55\nC,43\nD,91\nE,81";
      const data = { text: mockText };
      
      setExtractedText(data.text);
      
      // Parse the CSV text into structured data
      const parsedData = parseCSV(data.text);
      setExtractedData(parsedData);
      
      if (parsedData && parsedData.length > 0) {
        createDataset(parsedData);
      }
      
      setProgress(100);
    } catch (err) {
      console.error('Cloud Vision API error:', err);
      setError(`Error processing with Cloud API: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };
  
  const parseExtractedText = (text: string): any[] => {
    // Try to detect if this is a table or CSV format
    const lines = text.trim().split('\n');
    
    // Check if it looks like a CSV
    if (lines.some(line => line.includes(',') || line.includes('\t'))) {
      return parseCSV(text);
    }
    
    // Basic attempt to parse a text table
    try {
      const parsedRows = lines.map(line => {
        // Split by multiple spaces
        const values = line.trim().split(/\s{2,}/);
        return values;
      });
      
      // Check if all rows have the same number of columns
      const headerRow = parsedRows[0];
      if (headerRow && parsedRows.slice(1).every(row => row.length === headerRow.length)) {
        // Convert to array of objects
        return parsedRows.slice(1).map(row => {
          const obj: Record<string, string> = {};
          headerRow.forEach((header, i) => {
            obj[header] = row[i] || '';
          });
          return obj;
        });
      }
      
      // Could not identify a proper structure, return data with generated column names
      if (parsedRows.length > 1) {
        return parsedRows.slice(1).map(row => {
          const obj: Record<string, string> = {};
          row.forEach((value, i) => {
            obj[`Column ${i+1}`] = value;
          });
          return obj;
        });
      }
    } catch (e) {
      console.error('Error parsing text table:', e);
    }
    
    // Fallback: Just return the text as a single field
    return [{ text }];
  };
  
  const parseCSV = (text: string): any[] => {
    try {
      const lines = text.trim().split('\n');
      const delimiter = text.includes(',') ? ',' : '\t';
      
      const headers = lines[0].split(delimiter).map(h => h.trim());
      
      return lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim());
        const obj: Record<string, string> = {};
        
        headers.forEach((header, i) => {
          obj[header] = values[i] || '';
        });
        
        return obj;
      });
    } catch (e) {
      console.error('Error parsing CSV:', e);
      return [];
    }
  };
  
  const createDataset = (data: any[]) => {
    if (!data || data.length === 0) return;
    
    const columns = Object.keys(data[0]);
    const rowCount = data.length;
    const columnCount = columns.length;
    
    const dataTypes: Record<string, string> = {};
    columns.forEach(column => {
      // Determine column type by sampling values
      const numericSamples = data.slice(0, 5).filter(row => 
        !isNaN(Number(row[column])) && row[column] !== ''
      ).length;
      
      // If most samples are numeric, mark as quantitative
      dataTypes[column] = numericSamples >= 3 ? 'quantitative' : 'nominal';
    });
    
    const newDataset: DatasetMetadata = {
      id: `ocr-${Date.now()}`,
      name: image ? `${isPdf ? 'PDF' : 'OCR'} from ${image.name}` : 'Extracted Data',
      description: `Data extracted from ${isPdf ? 'PDF document' : 'image'} using ${extractionMethod === 0 ? (isPdf ? 'pdf-parse' : 'Tesseract OCR') : 'Cloud Vision API'}`,
      values: data,
      dataTypes,
      source: isPdf ? 'PDF Document' : (extractionMethod === 0 ? 'Tesseract OCR' : 'Cloud Vision API'),
      uploadDate: new Date().toISOString(),
      rowCount,
      columnCount,
      columns,
      metadata: {
        fields: columns.map(name => ({
          name,
          type: dataTypes[name]
        }))
      }
    };
    
    onDataExtracted(newDataset);
    setStatusMessage('Dataset created successfully!');
  };
  
  return (
    <Container>
      <Typography variant="h5" gutterBottom>Extract Data from Images & PDFs</Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Upload an image or PDF containing tabular data, charts, or text, and we'll extract the data for visualization.
      </Typography>
      
      <ImageUploadArea 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        $isDragging={isDragging}
      >
        <input 
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <ImageIcon style={{ fontSize: 48, color: 'var(--color-text-secondary)', marginBottom: 16 }} />
        <Typography variant="h6">Drop image or PDF here or click to browse</Typography>
        <Typography variant="body2" color="textSecondary">
          Supports JPEG, PNG, GIF and PDF files (max 10MB)
        </Typography>
      </ImageUploadArea>
      
      {imagePreviewUrl && (
        <ImagePreview>
          <img src={imagePreviewUrl} alt="Preview" />
        </ImagePreview>
      )}
      
      {isPdf && !imagePreviewUrl && image && (
        <Box sx={{ textAlign: 'center', my: 2, p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
          <Typography variant="subtitle1">PDF loaded: {image.name}</Typography>
          <Typography variant="caption" color="textSecondary">
            Size: {(image.size / 1024).toFixed(1)} KB
          </Typography>
        </Box>
      )}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {image && (
        <>
          <Tabs 
            value={extractionMethod} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab 
              icon={<TableChartIcon />} 
              label={isPdf ? "Local PDF Processing" : "Tesseract OCR"} 
              iconPosition="start"
            />
            <Tab 
              icon={<CloudIcon />} 
              label="Cloud API" 
              iconPosition="start"
            />
          </Tabs>
          
          <TabPanel $visible={extractionMethod === 0}>
            <Typography variant="body2" paragraph>
              {isPdf ? 
                "Extract data from PDF using local PDF parsing. This processes PDF text content directly without OCR." :
                "Extract data using Tesseract.js, a pure JavaScript OCR engine that runs entirely in your browser. Best for simple tables and text."
              }
            </Typography>
            <ButtonContainer>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={processWithTesseract}
                disabled={isProcessing || !image}
                startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : undefined}
              >
                {isProcessing ? 'Processing...' : isPdf ? 'Extract PDF Data' : 'Extract Data'}
              </Button>
            </ButtonContainer>
          </TabPanel>
          
          <TabPanel $visible={extractionMethod === 1}>
            <Typography variant="body2" paragraph>
              Extract data using Cloud Vision API for higher accuracy, especially with complex tables and forms.
              Requires an API key from Google Cloud Platform.
            </Typography>
            <CloudApiKeyInput>
              <Typography variant="body2">Cloud Vision API Key:</Typography>
              <input
                type="password"
                value={cloudApiKey}
                onChange={(e) => setCloudApiKey(e.target.value)}
                placeholder="Enter your API key"
              />
            </CloudApiKeyInput>
            <ButtonContainer>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={processWithCloudAPI}
                disabled={isProcessing || !image || !cloudApiKey}
                startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : undefined}
              >
                {isProcessing ? 'Processing...' : 'Extract with Cloud API'}
              </Button>
            </ButtonContainer>
          </TabPanel>
          
          {isProcessing && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress variant="determinate" value={progress} />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">{`${Math.round(progress)}%`}</Typography>
                </Box>
              </Box>
              <StatusMessage>{statusMessage}</StatusMessage>
            </Box>
          )}
          
          {extractedText && (
            <ResultsContainer>
              <Typography variant="h6" gutterBottom>Extracted Text</Typography>
              <ResultPreview>{extractedText}</ResultPreview>
              
              {extractedData && extractedData.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Structured Data</Typography>
                  <ResultPreview>{JSON.stringify(extractedData, null, 2)}</ResultPreview>
                </>
              )}
            </ResultsContainer>
          )}
        </>
      )}
    </Container>
  );
};

// Missing import - define the LinearProgress component separately
const LinearProgress = ({ variant, value }: { variant: string, value: number }) => {
  const trackHeight = 4;
  
  return (
    <div style={{ 
      width: '100%', 
      height: `${trackHeight}px`,
      backgroundColor: 'var(--color-border)',
      borderRadius: `${trackHeight}px`,
      overflow: 'hidden'
    }}>
      <div style={{
        height: '100%',
        width: `${value}%`,
        backgroundColor: 'var(--color-primary)',
        borderRadius: `${trackHeight}px`,
        transition: 'width 0.4s ease'
      }} />
    </div>
  );
}; 