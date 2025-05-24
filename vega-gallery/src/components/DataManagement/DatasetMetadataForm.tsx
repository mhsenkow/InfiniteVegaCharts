import React, { useState } from 'react';
import styled from 'styled-components';
import { TextField, Button, Chip, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DataAsset } from '../../types/dataset';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

interface DatasetMetadataFormProps {
  initialMetadata?: Partial<DataAsset>;
  onSubmit: (metadata: Partial<DataAsset>) => void;
  onCancel: () => void;
  open: boolean;
  previewData?: any[];
}

export const DatasetMetadataForm: React.FC<DatasetMetadataFormProps> = ({ 
  initialMetadata = {}, 
  onSubmit, 
  onCancel, 
  open,
  previewData
}) => {
  const [metadata, setMetadata] = useState<Partial<DataAsset>>({
    name: initialMetadata.name || '',
    description: initialMetadata.description || '',
    tags: initialMetadata.tags || [],
    origin: initialMetadata.origin || 'manual upload',
    source: initialMetadata.source || '',
  });
  
  const [tagInput, setTagInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !metadata.tags?.includes(tagInput.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(metadata);
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>Dataset Metadata</DialogTitle>
      <DialogContent>
        <FormContainer>
          <TextField
            name="name"
            label="Dataset Name"
            value={metadata.name}
            onChange={handleChange}
            required
            fullWidth
            autoFocus
            margin="normal"
          />
          
          <TextField
            name="description"
            label="Description"
            value={metadata.description}
            onChange={handleChange}
            multiline
            rows={3}
            fullWidth
            margin="normal"
          />
          
          <TextField
            name="source"
            label="Source"
            value={metadata.source}
            onChange={handleChange}
            placeholder="Where did this data come from?"
            fullWidth
            margin="normal"
          />
          
          <TextField
            name="origin"
            label="Origin"
            value={metadata.origin}
            onChange={handleChange}
            placeholder="e.g., manual upload, API import, etc."
            fullWidth
            margin="normal"
          />
          
          <Box>
            <TextField
              label="Tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add tags and press Enter"
              fullWidth
              margin="normal"
            />
            <Button 
              variant="outlined" 
              onClick={handleAddTag} 
              disabled={!tagInput.trim()}
              sx={{ mt: 1 }}
            >
              Add Tag
            </Button>
            
            <TagsContainer>
              {metadata.tags?.map(tag => (
                <Chip 
                  key={tag} 
                  label={tag} 
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </TagsContainer>
          </Box>
          
          {previewData && previewData.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Data Preview:</Typography>
              <Box sx={{ 
                maxHeight: '200px', 
                overflowY: 'auto', 
                border: '1px solid var(--color-border)', 
                borderRadius: '4px',
                padding: '8px',
                bgcolor: 'var(--color-surface-hover)'
              }}>
                <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                  {JSON.stringify(previewData, null, 2)}
                </pre>
              </Box>
            </Box>
          )}
        </FormContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={!metadata.name?.trim()}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 