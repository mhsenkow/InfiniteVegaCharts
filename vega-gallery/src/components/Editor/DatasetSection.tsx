import { useState, useRef } from 'react';
import styled from 'styled-components';
import Papa from 'papaparse';
import { LoadingState } from '../common/LoadingState';
import { detectDataTypes } from '../../utils/dataUtils';
import { storeDataset } from '../../utils/indexedDB';
import { DatabaseErrorModal } from '../DataManagement/DatabaseErrorModal';
import { DatasetMetadata } from '../../types/dataset';

const Section = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 1.2rem;
  color: var(--color-text-primary);
  margin-bottom: 16px;
`;

const UploadArea = styled.div`
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  background: var(--color-background);
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--color-primary);
    background: var(--color-surface-hover);
  }
`;

const FileInput = styled.div`
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UploadButton = styled.button<{ $disabled: boolean }>`
  width: 100%;
  padding: 10px;
  background: ${props => props.$disabled ? 'var(--color-surface-hover)' : 'var(--color-primary)'};
  color: var(--color-surface);
  border: none;
  border-radius: 4px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.7 : 1};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const DatasetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DatasetCard = styled.button<{ $active: boolean }>`
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
`;

const DatasetName = styled.div`
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TransformedBadge = styled.span`
  background-color: ${props => props.theme.mode === 'dark' ? '#2c3308' : '#f0f4c3'};
  color: ${props => props.theme.mode === 'dark' ? '#c5e1a5' : '#33691e'};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
`;

const DatasetInfo = styled.div`
  display: flex;
  gap: 16px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
`;

const EditableDatasetName = styled.input`
  font-weight: 500;
  color: var(--color-text-primary);
  border: 1px solid transparent;
  background: transparent;
  padding: 4px 8px;
  border-radius: 4px;
  width: 100%;

  &:hover {
    border-color: var(--color-border);
  }

  &:focus {
    border-color: var(--color-primary);
    outline: none;
    background: var(--color-surface);
  }
`;

// Create an extended dataset interface that includes our UI-specific properties
interface ExtendedDatasetMetadata extends DatasetMetadata {
  rowCount?: number;
  columnCount?: number;
}

interface DatasetSectionProps {
  onDatasetLoad: (data: any) => void;
}

export const DatasetSection = ({ onDatasetLoad }: DatasetSectionProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedDatasets, setUploadedDatasets] = useState<ExtendedDatasetMetadata[]>([]);
  const [dbError, setDbError] = useState<Error | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const handleDelete = (id: string) => {
    setUploadedDatasets(prev => prev.filter(dataset => dataset.id !== id));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    
    try {
      const results = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          preview: 1000,
          complete: resolve,
          error: reject
        });
      });

      let values = results.data.filter((row: any) => Object.keys(row).length > 0);
      
      const displaySample = values.slice(0, 100);
      
      const dataset = {
        id: `dataset-${Date.now()}`,
        name: file.name.split('.')[0],
        description: `Uploaded on ${new Date().toLocaleDateString()} (sampled preview)`,
        values: displaySample,
        fullPath: file.name,
        columns: Object.keys(displaySample[0] || {}),
        rowCount: values.length,
        columnCount: Object.keys(displaySample[0] || {}).length,
        source: 'upload',
        uploadDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        dataTypes: detectDataTypes(displaySample)
      };

      try {
        await storeDataset(dataset);
        onDatasetLoad(dataset);
      } catch (dbError) {
        console.error('Error storing dataset:', dbError);
        setDbError(dbError instanceof Error ? dbError : new Error('Unknown database error'));
        setIsErrorModalOpen(true);
        throw dbError; // Rethrow to be caught by the outer catch
      }
      
    } catch (error) {
      console.error('Error uploading dataset:', error);
      // Only show error modal for DB errors, not for parsing errors
      if (!isErrorModalOpen) {
        alert(`Error uploading dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatabaseReset = () => {
    // After successful reset, we can clear the error
    setDbError(null);
    // We might want to reload the app or component here
  };

  // Helper function to detect column type
  const detectColumnType = (values: any[]): string => {
    // Remove null/undefined values
    const cleanValues = values.filter(v => v != null);
    if (cleanValues.length === 0) return 'nominal';

    // Check if all values are numbers
    if (cleanValues.every(v => typeof v === 'number')) {
      return 'quantitative';
    }

    // Check if all values are valid dates
    if (cleanValues.every(v => !isNaN(Date.parse(String(v))))) {
      return 'temporal';
    }

    // Check if it's ordinal (small set of unique values)
    const uniqueValues = new Set(cleanValues);
    if (uniqueValues.size <= 20) {
      return 'ordinal';
    }

    // Default to nominal
    return 'nominal';
  };

  return (
    <Section>
      {isErrorModalOpen && (
        <DatabaseErrorModal 
          isOpen={isErrorModalOpen}
          error={dbError}
          onClose={() => setIsErrorModalOpen(false)}
          onReset={handleDatabaseReset}
        />
      )}
      
      {uploadedDatasets.length > 0 && (
        <Table>
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
            {uploadedDatasets.map(dataset => (
              <tr key={dataset.id}>
                <td>{dataset.name || 'Unnamed'}</td>
                <td>{dataset.rowCount || dataset.values?.length || 0}</td>
                <td>{dataset.columnCount || dataset.columns?.length || 0}</td>
                <td>{dataset.uploadDate ? new Date(dataset.uploadDate).toLocaleDateString() : 'Unknown'}</td>
                <td>
                  <DeleteButton onClick={() => dataset.id && handleDelete(dataset.id)}>
                    Delete
                  </DeleteButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <UploadArea>
        <FileInput>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 16px',
              background: 'var(--color-text-primary)',
              color: 'var(--color-surface)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Choose File
          </button>
          <span style={{ color: 'var(--color-text-primary)' }}>
            {selectedFile?.name || 'No file chosen'}
          </span>
        </FileInput>
        <UploadButton 
          onClick={() => selectedFile && handleUpload(selectedFile)}
          $disabled={!selectedFile || isLoading}
          disabled={!selectedFile || isLoading}
        >
          {isLoading ? (
            <LoadingState size="small" />
          ) : (
            'Upload Dataset'
          )}
        </UploadButton>
      </UploadArea>
    </Section>
  );
};

// Add these styled components
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;

  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }

  th {
    font-weight: 500;
    color: var(--color-text-secondary);
    background: var(--color-background);
  }
`;

const DeleteButton = styled.button`
  padding: 4px 8px;
  background: var(--color-error);
  color: var(--color-surface);
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: var(--color-error-dark, #c82333);
  }
`; 