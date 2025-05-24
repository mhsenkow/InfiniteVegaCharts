import React, { useState } from 'react';
import styled from 'styled-components';
import { Snapshot } from '../../utils/indexedDB';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: var(--color-surface);
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 15px ${props => props.theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)'};
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.25rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background-color: var(--color-surface-hover);
  }
`;

const SearchContainer = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 16px 10px 40px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  font-size: 1rem;
  outline: none;
  
  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary)30;
  }
`;

const SearchIcon1 = styled.div`
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
`;

const SnapshotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
    border-radius: 4px;
    
    &:hover {
      background: ${props => props.theme.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
    }
  }
`;

const SnapshotCard = styled.div`
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-surface);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${props => props.theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'};
    border-color: var(--color-primary);
  }
`;

const SnapshotThumbnail = styled.div<{ $thumbnail?: string }>`
  height: 140px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-background);
  background-image: ${props => props.$thumbnail ? `url(${props.$thumbnail})` : 'none'};
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
`;

const SnapshotDetails = styled.div`
  padding: 12px;
`;

const SnapshotName = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SnapshotDate = styled.div`
  font-size: 0.8rem;
  color: var(--color-text-secondary);
`;

const NoResults = styled.div`
  text-align: center;
  padding: 32px;
  color: var(--color-text-secondary);
`;

interface ChartSelectorProps {
  snapshots: Snapshot[];
  onSelect: (snapshot: Snapshot) => void;
  onClose: () => void;
}

export const ChartSelector: React.FC<ChartSelectorProps> = ({ 
  snapshots, 
  onSelect, 
  onClose 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter snapshots based on search
  const filteredSnapshots = snapshots.filter(snapshot => 
    snapshot.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Select a Chart</ModalTitle>
          <CloseButton onClick={onClose}>
            <CloseIcon />
          </CloseButton>
        </ModalHeader>
        
        <SearchContainer>
          <SearchIcon1>
            <SearchIcon fontSize="small" />
          </SearchIcon1>
          <SearchInput
            type="text"
            placeholder="Search charts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
        
        <SnapshotGrid>
          {filteredSnapshots.length > 0 ? (
            filteredSnapshots.map(snapshot => (
              <SnapshotCard 
                key={snapshot.id} 
                onClick={() => onSelect(snapshot)}
              >
                <SnapshotThumbnail $thumbnail={snapshot.thumbnail} />
                <SnapshotDetails>
                  <SnapshotName>{snapshot.name}</SnapshotName>
                  <SnapshotDate>{formatDate(snapshot.createdAt)}</SnapshotDate>
                </SnapshotDetails>
              </SnapshotCard>
            ))
          ) : (
            <NoResults>
              {searchTerm ? 'No matching charts found' : 'No charts available'}
            </NoResults>
          )}
        </SnapshotGrid>
      </ModalContent>
    </ModalOverlay>
  );
}; 