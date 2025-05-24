import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { exportAllData, importData, calculateDatabaseSize } from '../../utils/exportImport';

const Container = styled.div`
  background: var(--color-surface);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--color-text-primary);
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: var(--color-surface);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--color-primaryDark);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const ImportButton = styled(Button)`
  background-color: var(--color-secondary);
  
  &:hover {
    background-color: var(--color-secondaryDark);
  }
`;

const MessageContainer = styled.div<{ $success?: boolean }>`
  margin-top: 16px;
  padding: 12px;
  background-color: ${props => props.$success ? '#e6f7e6' : '#fff6f6'};
  border: 1px solid ${props => props.$success ? '#c3e6c3' : '#f8d7d7'};
  border-radius: 4px;
  color: ${props => props.$success ? '#2c662d' : '#9f3a38'};
`;

const InfoText = styled.p`
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 14px;
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
  margin-bottom: 16px;
  background-color: var(--color-background);
  padding: 12px;
  border-radius: 4px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--color-text-primary);
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: var(--color-text-secondary);
`;

export const ExportImport: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [dbSize, setDbSize] = useState<string>('Calculating...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Calculate database size when component mounts
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      const { sizeText } = await calculateDatabaseSize();
      setDbSize(sizeText);
    } catch (error) {
      console.error('Failed to load database stats:', error);
      setDbSize('Unknown');
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setMessage(null);
      await exportAllData();
      setMessage({ text: 'Export completed successfully!', success: true });
      
      // Refresh database stats after export
      await loadDatabaseStats();
    } catch (error) {
      setMessage({ 
        text: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        success: false 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setMessage(null);

      const result = await importData(file);
      setMessage({ 
        text: `Import completed successfully! Imported ${result.snapshots} snapshots and ${result.canvases} canvases.`,
        success: true 
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh database stats after import
      await loadDatabaseStats();
    } catch (error) {
      setMessage({ 
        text: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        success: false 
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Container>
      <Title>Export & Import</Title>
      
      <InfoText>
        Export your snapshots and dashboards to share them or create a backup.
        Import previously exported data to restore your snapshots and dashboards.
      </InfoText>

      <StatsContainer>
        <StatItem>
          <StatValue>{dbSize}</StatValue>
          <StatLabel>Database Size</StatLabel>
        </StatItem>
      </StatsContainer>
      
      <ButtonContainer>
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export All Data'}
        </Button>
        
        <ImportButton 
          onClick={handleImportClick}
          disabled={isImporting}
        >
          {isImporting ? 'Importing...' : 'Import Data'}
        </ImportButton>
        
        <FileInput 
          type="file" 
          ref={fileInputRef} 
          accept=".json" 
          onChange={handleFileSelect}
        />
      </ButtonContainer>
      
      {message && (
        <MessageContainer $success={message.success}>
          {message.text}
        </MessageContainer>
      )}
    </Container>
  );
}; 