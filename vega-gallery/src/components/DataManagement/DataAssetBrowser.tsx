import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Box, 
  Card, 
  Typography, 
  Chip, 
  TextField, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import { DataAsset } from '../../types/dataset';
import { getAllDatasets, deleteDataset } from '../../utils/indexedDB';
import { DatasetMetadataForm } from './DatasetMetadataForm';

const SearchContainer = styled.div`
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
`;

const FilterContainer = styled(Paper)`
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const DatasetGrid = styled(Grid)`
  margin-top: 16px;
`;

const StyledCard = styled(Card)`
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
  color: ${props => props.theme.colors.text?.secondary || '#6c757d'};
  font-size: 0.8rem;
`;

const MetadataDetailTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 8px;
    border-bottom: 1px solid var(--color-border);
    text-align: left;
  }
  
  th {
    background-color: #f5f5f5;
    font-weight: 500;
  }
`;

interface DataAssetBrowserProps {
  onSelectDataset?: (dataset: DataAsset) => void;
  onUpdateDataset?: (dataset: DataAsset) => void;
  selectable?: boolean;
}

export const DataAssetBrowser: React.FC<DataAssetBrowserProps> = ({ 
  onSelectDataset, 
  onUpdateDataset,
  selectable = false
}) => {
  const [datasets, setDatasets] = useState<DataAsset[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<DataAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<DataAsset | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allOrigins, setAllOrigins] = useState<string[]>([]);
  
  useEffect(() => {
    loadDatasets();
  }, []);
  
  const loadDatasets = async () => {
    try {
      const allDatasets = await getAllDatasets();
      setDatasets(allDatasets);
      setFilteredDatasets(allDatasets);
      
      // Extract all unique tags and origins
      const tagSet = new Set<string>();
      const originSet = new Set<string>();
      
      allDatasets.forEach(dataset => {
        dataset.tags?.forEach(tag => tagSet.add(tag));
        if (dataset.origin) originSet.add(dataset.origin);
      });
      
      setAllTags(Array.from(tagSet));
      setAllOrigins(Array.from(originSet));
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  };
  
  useEffect(() => {
    // Apply filters and search
    let filtered = [...datasets];
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(dataset => 
        dataset.name.toLowerCase().includes(query) || 
        dataset.description?.toLowerCase().includes(query) ||
        dataset.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply tag filters
    if (selectedTags.length > 0) {
      filtered = filtered.filter(dataset => 
        dataset.tags?.some(tag => selectedTags.includes(tag))
      );
    }
    
    // Apply origin filters
    if (selectedOrigins.length > 0) {
      filtered = filtered.filter(dataset => 
        dataset.origin && selectedOrigins.includes(dataset.origin)
      );
    }
    
    setFilteredDatasets(filtered);
  }, [searchQuery, selectedTags, selectedOrigins, datasets]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  const handleOriginSelect = (origin: string) => {
    setSelectedOrigins(prev => 
      prev.includes(origin) 
        ? prev.filter(o => o !== origin) 
        : [...prev, origin]
    );
  };
  
  const handleViewDetails = (dataset: DataAsset) => {
    setSelectedDataset(dataset);
    setShowDetailDialog(true);
  };
  
  const handleEdit = (dataset: DataAsset) => {
    setSelectedDataset(dataset);
    setShowEditDialog(true);
  };
  
  const handleDelete = async (dataset: DataAsset) => {
    if (window.confirm(`Are you sure you want to delete "${dataset.name}"?`)) {
      try {
        await deleteDataset(dataset.id);
        setDatasets(prev => prev.filter(d => d.id !== dataset.id));
      } catch (error) {
        console.error('Failed to delete dataset:', error);
        alert('Failed to delete dataset. Please try again.');
      }
    }
  };
  
  const handleMetadataSubmit = async (metadata: Partial<DataAsset>) => {
    if (!selectedDataset) return;
    
    try {
      const updatedDataset = {
        ...selectedDataset,
        ...metadata,
        updatedAt: new Date().toISOString()
      };
      
      // Call onUpdateDataset if provided
      if (onUpdateDataset) {
        onUpdateDataset(updatedDataset);
      }
      
      // Update local state
      setDatasets(prev => 
        prev.map(d => d.id === updatedDataset.id ? updatedDataset : d)
      );
      
      setShowEditDialog(false);
    } catch (error) {
      console.error('Failed to update dataset metadata:', error);
      alert('Failed to update dataset. Please try again.');
    }
  };
  
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedOrigins([]);
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Data Assets Library</Typography>
      
      <SearchContainer>
        <TextField
          placeholder="Search datasets..."
          value={searchQuery}
          onChange={handleSearchChange}
          fullWidth
          variant="outlined"
          size="small"
        />
        <Button 
          startIcon={<FilterListIcon />} 
          variant="outlined"
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
        </Button>
      </SearchContainer>
      
      {showFilters && (
        <FilterContainer>
          <Typography variant="subtitle2" style={{ marginRight: 8 }}>Filter by:</Typography>
          
          <Box>
            <Typography variant="caption" display="block">Tags:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {allTags.map(tag => (
                <Chip 
                  key={tag}
                  label={tag}
                  size="small"
                  onClick={() => handleTagSelect(tag)}
                  color={selectedTags.includes(tag) ? "primary" : "default"}
                  variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                />
              ))}
            </Box>
          </Box>
          
          <Box sx={{ marginLeft: 2 }}>
            <Typography variant="caption" display="block">Origins:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {allOrigins.map(origin => (
                <Chip 
                  key={origin}
                  label={origin}
                  size="small"
                  onClick={() => handleOriginSelect(origin)}
                  color={selectedOrigins.includes(origin) ? "primary" : "default"}
                  variant={selectedOrigins.includes(origin) ? "filled" : "outlined"}
                />
              ))}
            </Box>
          </Box>
          
          {(selectedTags.length > 0 || selectedOrigins.length > 0 || searchQuery) && (
            <Button 
              variant="text" 
              size="small" 
              onClick={handleClearFilters}
              sx={{ marginLeft: 'auto' }}
            >
              Clear Filters
            </Button>
          )}
        </FilterContainer>
      )}
      
      <Typography variant="subtitle1">
        {filteredDatasets.length} datasets found
      </Typography>
      
      <DatasetGrid container spacing={2}>
        {filteredDatasets.map(dataset => (
          <Grid item xs={12} sm={6} md={4} key={dataset.id}>
            <StyledCard>
              <CardHeader>
                <Typography variant="h6" noWrap title={dataset.name}>
                  {dataset.name}
                </Typography>
                <Tooltip title="View Details">
                  <IconButton 
                    size="small" 
                    onClick={() => handleViewDetails(dataset)}
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CardHeader>
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {dataset.description && dataset.description.length > 80 
                  ? `${dataset.description.substring(0, 80)}...` 
                  : dataset.description || 'No description'}
              </Typography>
              
              {dataset.tags && dataset.tags.length > 0 && (
                <TagsContainer>
                  {dataset.tags.slice(0, 3).map(tag => (
                    <Chip 
                      key={tag} 
                      label={tag} 
                      size="small" 
                      variant="outlined"
                    />
                  ))}
                  {dataset.tags.length > 3 && (
                    <Chip 
                      label={`+${dataset.tags.length - 3} more`} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                </TagsContainer>
              )}
              
              <StatsContainer>
                {dataset.rowCount && (
                  <span>{dataset.rowCount.toLocaleString()} rows</span>
                )}
                {dataset.columnCount && (
                  <span>{dataset.columnCount} columns</span>
                )}
                {dataset.origin && (
                  <span>Origin: {dataset.origin}</span>
                )}
              </StatsContainer>
              
              <CardActions>
                {selectable && onSelectDataset && (
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => onSelectDataset(dataset)}
                  >
                    Select
                  </Button>
                )}
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(dataset)}
                >
                  Edit
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={() => handleDelete(dataset)}
                >
                  Delete
                </Button>
              </CardActions>
            </StyledCard>
          </Grid>
        ))}
      </DatasetGrid>
      
      {/* Details Dialog */}
      <Dialog 
        open={showDetailDialog} 
        onClose={() => setShowDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedDataset && (
          <>
            <DialogTitle>
              Dataset Details: {selectedDataset.name}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">Metadata</Typography>
                <MetadataDetailTable>
                  <tbody>
                    <tr>
                      <th>ID</th>
                      <td>{selectedDataset.id}</td>
                    </tr>
                    <tr>
                      <th>Description</th>
                      <td>{selectedDataset.description || 'No description'}</td>
                    </tr>
                    <tr>
                      <th>Source</th>
                      <td>{selectedDataset.source || 'Unknown'}</td>
                    </tr>
                    <tr>
                      <th>Origin</th>
                      <td>{selectedDataset.origin || 'Unknown'}</td>
                    </tr>
                    <tr>
                      <th>Created</th>
                      <td>{new Date(selectedDataset.createdAt).toLocaleString()}</td>
                    </tr>
                    {selectedDataset.updatedAt && (
                      <tr>
                        <th>Last Updated</th>
                        <td>{new Date(selectedDataset.updatedAt).toLocaleString()}</td>
                      </tr>
                    )}
                    <tr>
                      <th>Rows</th>
                      <td>{selectedDataset.rowCount?.toLocaleString() || 'Unknown'}</td>
                    </tr>
                    <tr>
                      <th>Columns</th>
                      <td>{selectedDataset.columnCount || 'Unknown'}</td>
                    </tr>
                    <tr>
                      <th>Fingerprint</th>
                      <td>
                        <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                          {selectedDataset.fingerprint || 'Not available'}
                        </code>
                      </td>
                    </tr>
                    <tr>
                      <th>Tags</th>
                      <td>
                        {selectedDataset.tags && selectedDataset.tags.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selectedDataset.tags.map(tag => (
                              <Chip key={tag} label={tag} size="small" />
                            ))}
                          </Box>
                        ) : (
                          'No tags'
                        )}
                      </td>
                    </tr>
                  </tbody>
                </MetadataDetailTable>
              </Box>
              
              {/* Data Preview */}
              <Box>
                <Typography variant="h6">Data Preview</Typography>
                {selectedDataset.previewRows && selectedDataset.previewRows.length > 0 ? (
                  <Box sx={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto', 
                    border: '1px solid #eee',
                    borderRadius: 1,
                    mt: 1 
                  }}>
                    <pre style={{ padding: 16, margin: 0, fontSize: '0.9rem' }}>
                      {JSON.stringify(selectedDataset.previewRows, null, 2)}
                    </pre>
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No preview data available
                  </Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDetailDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Edit Dialog */}
      {selectedDataset && (
        <DatasetMetadataForm
          initialMetadata={selectedDataset}
          onSubmit={handleMetadataSubmit}
          onCancel={() => setShowEditDialog(false)}
          open={showEditDialog}
          previewData={selectedDataset.previewRows}
        />
      )}
    </Box>
  );
}; 