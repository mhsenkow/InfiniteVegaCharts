import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useDashboardStore } from '../../store/dashboardStore';
import { GridView } from './GridView';
import { CanvasView } from './CanvasView';
import { ViewMode } from '../../types/dashboard';
import { getAllDashboards, getDashboard, storeDashboard, deleteDashboard } from '../../utils/indexedDB';
import { v4 as uuidv4 } from 'uuid';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import GridViewIcon from '@mui/icons-material/GridView';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

const Container = styled.div`
  padding: 20px;
  background: var(--color-surface);
  border-radius: 8px;
  box-shadow: 0 2px 4px ${props => props.theme.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'};
  margin-bottom: 20px;
  min-height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
`;

const Title = styled.h2`
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.5rem;
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  background: ${props => {
    if (props.theme.mode === 'dark') {
      return props.$primary ? 'var(--color-primary)' : 'rgba(30, 30, 30, 0.7)';
    }
    return props.$primary ? 'var(--color-primary)' : '#f1f3f5';
  }};
  color: ${props => {
    if (props.theme.mode === 'dark') {
      return props.$primary ? 'var(--color-text-inverse)' : 'rgba(255, 255, 255, 0.8)';
    }
    return props.$primary ? 'var(--color-text-inverse)' : 'var(--color-text-primary)';
  }};
  border: ${props => props.theme.mode === 'dark' && !props.$primary ? '1px solid rgba(255, 255, 255, 0.16)' : 'none'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: ${props => props.theme.mode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.3)' : 'none'};
  transition: all 0.2s ease-in-out;
  
  &:hover {
    background: ${props => {
      if (props.theme.mode === 'dark') {
        return props.$primary ? 'var(--color-primary-dark, #1976d2)' : 'rgba(255, 255, 255, 0.08)';
      }
      return props.$primary ? 'var(--color-primary-dark, #1976d2)' : 'var(--color-surface-hover)';
    }};
    transform: ${props => props.theme.mode === 'dark' ? 'translateY(-1px)' : 'none'};
    box-shadow: ${props => props.theme.mode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.4)' : 'none'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`;

const DashboardControls = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
`;

const DashboardSelector = styled.select`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'var(--color-border)'};
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(30, 30, 30, 0.7)' : 'var(--color-surface)'};
  color: var(--color-text-primary);
  font-size: 0.9rem;
  min-width: 200px;
  box-shadow: ${props => props.theme.mode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none'};
  
  option {
    background-color: ${props => props.theme.mode === 'dark' ? '#333' : 'white'};
    color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'};
  }
`;

const DashboardNameInput = styled.input`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'var(--color-border)'};
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(30, 30, 30, 0.7)' : 'var(--color-surface)'};
  color: var(--color-text-primary);
  font-size: 0.9rem;
  min-width: 200px;
  flex: 1;
  box-shadow: ${props => props.theme.mode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none'};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.mode === 'dark' ? 'rgba(66, 165, 245, 0.6)' : 'var(--color-primary)'};
    box-shadow: ${props => props.theme.mode === 'dark' ? '0 0 0 2px rgba(66, 165, 245, 0.2)' : '0 0 0 2px rgba(25, 118, 210, 0.2)'};
  }
`;

const ViewSelectorGroup = styled.div`
  display: flex;
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'var(--color-border)'};
  border-radius: 4px;
  overflow: hidden;
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(30, 30, 30, 0.6)' : 'transparent'};
  box-shadow: ${props => props.theme.mode === 'dark' ? '0 2px 6px rgba(0, 0, 0, 0.3)' : 'none'};
`;

const ViewButton = styled.button<{ $active: boolean }>`
  padding: 8px 12px;
  background: ${props => {
    if (props.theme.mode === 'dark') {
      return props.$active ? 'rgba(66, 165, 245, 0.5)' : 'transparent';
    }
    return props.$active ? 'var(--color-primary)' : 'var(--color-surface)';
  }};
  color: ${props => {
    if (props.theme.mode === 'dark') {
      return props.$active ? 'white' : 'rgba(255, 255, 255, 0.8)';
    }
    return props.$active ? 'var(--color-text-inverse)' : 'var(--color-text-primary)';
  }};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: ${props => props.$active ? 500 : 400};
  text-shadow: ${props => props.theme.mode === 'dark' && props.$active ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'};
  transition: all 0.2s ease-in-out;
  
  &:hover {
    background: ${props => {
      if (props.theme.mode === 'dark') {
        return props.$active ? 'rgba(66, 165, 245, 0.5)' : 'rgba(255, 255, 255, 0.1)';
      }
      return props.$active ? 'var(--color-primary)' : 'var(--color-surface-hover)';
    }};
  }
`;

export const DashboardContainer: React.FC = () => {
  const { 
    viewMode, 
    setViewMode, 
    currentDashboard, 
    setCurrentDashboard,
    loadSnapshots
  } = useDashboardStore();
  
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [dashboardName, setDashboardName] = useState('');
  const [selectedDashboardId, setSelectedDashboardId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Load dashboards on mount
  useEffect(() => {
    loadDashboards();
    loadSnapshots();
  }, [loadSnapshots]);
  
  const loadDashboards = async () => {
    setIsLoading(true);
    try {
      const dashboards = await getAllDashboards();
      setDashboards(dashboards);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load dashboards:', error);
      setIsLoading(false);
    }
  };
  
  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
  };
  
  const handleDashboardChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dashboardId = e.target.value;
    setSelectedDashboardId(dashboardId);
    
    if (!dashboardId) {
      setCurrentDashboard(null);
      setDashboardName('New Dashboard');
      return;
    }
    
    setIsLoading(true);
    try {
      const dashboard = await getDashboard(dashboardId);
      if (dashboard) {
        setCurrentDashboard(dashboard);
        setDashboardName(dashboard.name);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setIsLoading(false);
    }
  };
  
  const createNewDashboard = () => {
    const newDashboard = {
      id: uuidv4(),
      name: dashboardName || 'New Dashboard',
      charts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setCurrentDashboard(newDashboard);
    setSelectedDashboardId(newDashboard.id);
    setDashboards([...dashboards, newDashboard]);
  };
  
  const saveDashboard = async () => {
    if (!currentDashboard) return;
    
    setIsSaving(true);
    
    try {
      const updatedDashboard = {
        ...currentDashboard,
        name: dashboardName || currentDashboard.name,
        updatedAt: new Date().toISOString()
      };
      
      await storeDashboard(updatedDashboard);
      setCurrentDashboard(updatedDashboard);
      
      // Update dashboards list
      setDashboards(prev => 
        prev.map(d => d.id === updatedDashboard.id ? updatedDashboard : d)
      );
      
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save dashboard:', error);
      setIsSaving(false);
    }
  };
  
  const deleteSelectedDashboard = async () => {
    if (!currentDashboard?.id) return;
    
    if (!window.confirm(`Are you sure you want to delete the dashboard "${currentDashboard.name}"?`)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await deleteDashboard(currentDashboard.id);
      
      // Update dashboards list
      setDashboards(prev => prev.filter(d => d.id !== currentDashboard.id));
      setCurrentDashboard(null);
      setSelectedDashboardId('');
      setDashboardName('New Dashboard');
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <Container>
      <DashboardHeader>
        <Title>Dashboard</Title>
        <Controls>
          <ViewSelectorGroup>
            <ViewButton 
              $active={viewMode === ViewMode.GRID} 
              onClick={() => handleViewChange(ViewMode.GRID)}
            >
              <GridViewIcon fontSize="small" style={{ marginRight: 4 }} />
              Grid
            </ViewButton>
            <ViewButton 
              $active={viewMode === ViewMode.CANVAS} 
              onClick={() => handleViewChange(ViewMode.CANVAS)}
            >
              <ViewQuiltIcon fontSize="small" style={{ marginRight: 4 }} />
              Canvas
            </ViewButton>
          </ViewSelectorGroup>
        </Controls>
      </DashboardHeader>
      
      <DashboardControls>
        <DashboardSelector
          value={selectedDashboardId}
          onChange={handleDashboardChange}
          disabled={isLoading}
        >
          <option value="">-- New Dashboard --</option>
          {dashboards.map(dashboard => (
            <option key={dashboard.id} value={dashboard.id}>
              {dashboard.name}
            </option>
          ))}
        </DashboardSelector>
        
        <DashboardNameInput
          type="text"
          value={dashboardName}
          onChange={(e) => setDashboardName(e.target.value)}
          placeholder="Dashboard Name"
          disabled={isLoading}
        />
        
        <Button 
          onClick={createNewDashboard}
          disabled={isLoading}
        >
          <AddIcon fontSize="small" />
          New
        </Button>
        
        <Button 
          $primary
          onClick={saveDashboard}
          disabled={isLoading || isSaving || !dashboardName.trim() || !currentDashboard}
        >
          <SaveIcon fontSize="small" />
          Save
        </Button>
        
        {currentDashboard && (
          <Button
            onClick={deleteSelectedDashboard}
            disabled={isLoading}
            style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}
          >
            <DeleteIcon fontSize="small" />
            Delete
          </Button>
        )}
      </DashboardControls>
      
      {viewMode === ViewMode.GRID ? (
        <GridView />
      ) : (
        <CanvasView />
      )}
    </Container>
  );
}; 