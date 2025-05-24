import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { storeSnapshot, getAllSnapshots, deleteSnapshot, Snapshot } from '../../utils/indexedDB';
import { createSnapshot } from '../../utils/chartRenderer';
import { DatasetMetadata } from '../../types/dataset';

const PanelContainer = styled.div`
  padding: 16px;
  background: var(--color-surface);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--color-text-primary);
  font-size: 1.1rem;
`;

const SnapshotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;

const SnapshotCard = styled.div`
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const SnapshotThumbnail = styled.div`
  height: 120px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
`;

const SnapshotInfo = styled.div`
  padding: 8px;
  font-size: 0.9rem;
`;

const SnapshotName = styled.div`
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SnapshotDate = styled.div`
  font-size: 0.8rem;
  color: var(--color-text-secondary);
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
`;

const Button = styled.button<{ $primary?: boolean; $disabled?: boolean }>`
  padding: 6px 12px;
  background: ${props => props.$disabled ? '#e9ecef' : props.$primary ? props.theme.colors.primary : '#f1f3f5'};
  color: ${props => props.$disabled ? '#adb5bd' : props.$primary ? 'white' : props.theme.colors.text.primary};
  border: none;
  border-radius: 4px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-size: 0.85rem;
  
  &:hover {
    background: ${props => props.$disabled ? '#e9ecef' : props.$primary ? '#1976d2' : '#e9ecef'};
  }
`;

const DeleteButton = styled.button`
  padding: 4px 8px;
  background: transparent;
  color: var(--color-error);
  border: none;
  font-size: 0.8rem;
  cursor: pointer;
  border-radius: 4px;
  
  &:hover {
    background: #ffebee;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: var(--color-text-secondary);
  background: var(--color-background);
  border-radius: 8px;
  border: 1px dashed var(--color-border);
`;

const StatusMessage = styled.div<{ $error?: boolean }>`
  padding: 10px;
  margin: 10px 0;
  background-color: ${props => props.$error ? '#fff5f5' : '#ebfbee'};
  color: ${props => props.$error ? '#e03131' : '#2b8a3e'};
  border-radius: 4px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  
  &::before {
    content: ${props => props.$error ? '"⚠️"' : '"ℹ️"'};
    margin-right: 8px;
  }
`;

interface SnapshotPanelProps {
  chartId: string;
  currentSpec: any;
  vegaView: any;
  onLoadSnapshot: (spec: any) => void;
  currentDataset?: DatasetMetadata;
}

export const SnapshotPanel = ({ 
  chartId, 
  currentSpec, 
  vegaView, 
  onLoadSnapshot,
  currentDataset
}: SnapshotPanelProps) => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSnapshots();
  }, [chartId]);
  
  // Clear error when vegaView changes
  useEffect(() => {
    if (vegaView) {
      setError(null);
      setMessage('Chart is ready for snapshots');
      
      // Clear message after 3 seconds
      const timeoutId = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timeoutId);
    } else {
      setError('Chart view is not ready. Try clicking on the chart area first.');
    }
  }, [vegaView]);

  const loadSnapshots = async () => {
    try {
      setIsLoading(true);
      const allSnapshots = await getAllSnapshots();
      const filteredSnapshots = allSnapshots.filter(s => s.chartId === chartId);
      setSnapshots(filteredSnapshots);
    } catch (error) {
      console.error('Failed to load snapshots:', error);
      setError('Failed to load snapshots. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeSnapshot = async () => {
    // Clear any previous messages/errors
    setError(null);
    setMessage(null);
    
    if (!vegaView) {
      setError('Cannot take snapshot: Vega view is not available. Try clicking on the chart area first.');
      console.error('Vega view is not available');
      return;
    }
    
    try {
      setIsLoading(true);
      
      console.log('Taking snapshot with vegaView:', vegaView);
      
      // Create a thumbnail from the current view
      const thumbnail = await createSnapshot(vegaView);
      
      // Create a name if not provided
      const name = snapshotName || `Snapshot ${new Date().toLocaleString()}`;
      
      // Create snapshot object
      const snapshot: Snapshot = {
        id: `snap-${Date.now()}`,
        name,
        chartId,
        spec: currentSpec,
        createdAt: new Date().toISOString(),
        thumbnail
      };
      
      // Add dataset information if available
      if (currentDataset) {
        snapshot.datasetId = currentDataset.id;
        snapshot.datasetFingerprint = currentDataset.fingerprint;
        
        // Store essential dataset metadata for historical context
        snapshot.datasetMetadata = {
          id: currentDataset.id,
          name: currentDataset.name,
          description: currentDataset.description,
          source: currentDataset.source,
          origin: currentDataset.origin,
          tags: currentDataset.tags,
          createdAt: currentDataset.createdAt,
          rowCount: currentDataset.rowCount,
          columnCount: currentDataset.columnCount
        };
      }
      
      // Store in database
      await storeSnapshot(snapshot);
      
      // Reset name and reload
      setSnapshotName('');
      setMessage('Snapshot saved successfully!');
      await loadSnapshots();
    } catch (error) {
      console.error('Failed to take snapshot:', error);
      setError(`Failed to take snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    try {
      await deleteSnapshot(id);
      await loadSnapshots();
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
    }
  };

  const handleLoadSnapshot = (snapshot: Snapshot) => {
    onLoadSnapshot(snapshot.spec);
  };

  return (
    <PanelContainer>
      <Title>Snapshots</Title>
      
      <div>
        <input
          type="text"
          placeholder="Snapshot name (optional)"
          value={snapshotName}
          onChange={(e) => setSnapshotName(e.target.value)}
          style={{ 
            padding: '8px', 
            borderRadius: '4px', 
            border: '1px solid #ced4da', 
            width: '70%' 
          }}
        />
        <Button 
          $primary 
          $disabled={isLoading || !vegaView}
          onClick={handleTakeSnapshot}
          disabled={isLoading || !vegaView}
          style={{ marginLeft: '8px' }}
          title={!vegaView ? "Chart needs to be fully loaded before taking a snapshot" : ""}
        >
          {isLoading ? 'Saving...' : 'Take Snapshot'}
        </Button>
      </div>
      
      {error && <StatusMessage $error>{error}</StatusMessage>}
      {message && <StatusMessage>{message}</StatusMessage>}
      
      {snapshots.length === 0 ? (
        <EmptyState>
          No snapshots yet. Take a snapshot to save the current chart state.
        </EmptyState>
      ) : (
        <SnapshotGrid>
          {snapshots.map(snapshot => (
            <SnapshotCard key={snapshot.id}>
              <SnapshotThumbnail 
                style={{ backgroundImage: `url(${snapshot.thumbnail})` }}
                onClick={() => handleLoadSnapshot(snapshot)}
              />
              <SnapshotInfo>
                <SnapshotName>{snapshot.name}</SnapshotName>
                <SnapshotDate>
                  {new Date(snapshot.createdAt).toLocaleString()}
                </SnapshotDate>
                <ActionButtons>
                  <Button onClick={() => handleLoadSnapshot(snapshot)}>
                    Load
                  </Button>
                  <DeleteButton onClick={() => handleDeleteSnapshot(snapshot.id)}>
                    Delete
                  </DeleteButton>
                </ActionButtons>
              </SnapshotInfo>
            </SnapshotCard>
          ))}
        </SnapshotGrid>
      )}
    </PanelContainer>
  );
}; 