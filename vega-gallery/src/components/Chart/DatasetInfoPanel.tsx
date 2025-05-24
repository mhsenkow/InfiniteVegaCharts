import React from 'react';
import styled from 'styled-components';
import { Box, Typography, Chip, Divider, Tooltip, IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import HistoryIcon from '@mui/icons-material/History';
import { DataAsset } from '../../types/dataset';

const InfoContainer = styled(Box)`
  padding: 16px;
  background-color: ${props => props.theme.colors?.surface || '#ffffff'};
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  border: 1px solid ${props => props.theme.colors?.border || '#e9ecef'};
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
`;

const MetaStat = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text?.secondary || '#6c757d'};
`;

const MetaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

interface DatasetInfoPanelProps {
  dataset: DataAsset;
  showDetails?: boolean;
  onViewDetails?: () => void;
}

export const DatasetInfoPanel: React.FC<DatasetInfoPanelProps> = ({
  dataset,
  showDetails = true,
  onViewDetails
}) => {
  const formattedDate = dataset.updatedAt 
    ? new Date(dataset.updatedAt).toLocaleDateString() 
    : dataset.createdAt 
      ? new Date(dataset.createdAt).toLocaleDateString()
      : 'Unknown date';

  return (
    <InfoContainer>
      <MetaHeader>
        <Typography variant="subtitle1" fontWeight="bold">Dataset Source</Typography>
        {showDetails && onViewDetails && (
          <Tooltip title="View Full Details">
            <IconButton size="small" onClick={onViewDetails}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </MetaHeader>
      
      <Typography variant="body1">{dataset.name}</Typography>
      
      {dataset.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {dataset.description}
        </Typography>
      )}
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        {dataset.source && (
          <MetaStat>
            Source: {dataset.source}
          </MetaStat>
        )}
        
        {(dataset.rowCount || dataset.columnCount) && (
          <MetaStat>
            {dataset.rowCount && `${dataset.rowCount.toLocaleString()} rows`}
            {dataset.rowCount && dataset.columnCount && ' · '}
            {dataset.columnCount && `${dataset.columnCount} columns`}
          </MetaStat>
        )}
        
        <MetaStat>
          <HistoryIcon fontSize="inherit" />
          {formattedDate}
        </MetaStat>
      </Box>
      
      {dataset.tags && dataset.tags.length > 0 && (
        <TagsContainer>
          {dataset.tags.map(tag => (
            <Chip 
              key={tag} 
              label={tag} 
              size="small" 
              variant="outlined"
            />
          ))}
        </TagsContainer>
      )}
    </InfoContainer>
  );
}; 