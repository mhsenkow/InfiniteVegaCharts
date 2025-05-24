import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useDashboardStore } from '../../store/dashboardStore';
import { renderVegaLite } from '../../utils/chartRenderer';
import { ChartSelector } from './ChartSelector';
import { DashboardChart } from '../../types/dashboard';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useGesture } from '@use-gesture/react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

// Canvas container with zoom and pan capabilities
const CanvasContainer = styled.div`
  flex-grow: 1;
  position: relative;
  overflow: hidden;
  background-color: var(--color-background);
  border-radius: 8px;
  min-height: 600px;
`;

const CanvasControls = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 50;
`;

const CanvasButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px ${props => props.theme.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)'};
  color: var(--color-text-primary);
  transition: all 0.2s ease;
  
  &:hover {
    background-color: var(--color-background);
    transform: scale(1.05);
    box-shadow: 0 4px 12px ${props => props.theme.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)'};
  }
  
  &.add-chart {
    background-color: var(--color-primary);
    color: var(--color-surface);
  }
  
  &.add-chart:hover {
    background-color: var(--color-primary);
  }
`;

const CanvasSurface = styled.div<{ 
  $zoom: number; 
  $offsetX: number; 
  $offsetY: number;
  $isDragging: boolean;
  $isPanning: boolean;
}>`
  position: absolute;
  transform-origin: 0 0;
  transform: scale(${props => props.$zoom}) translate(${props => props.$offsetX}px, ${props => props.$offsetY}px);
  min-width: 2000px;
  min-height: 2000px;
  cursor: ${props => props.$isPanning ? 'grabbing' : props.$isDragging ? 'grabbing' : 'default'};
  touch-action: none;
`;

const PanCue = styled.div`
  position: fixed;
  top: 20px;
  left: 20px;
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.7)'};
  color: var(--color-surface);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  z-index: 50;
  pointer-events: none;
`;

interface ChartNodeProps {
  chart: DashboardChart;
  onRemove: (id: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  bringToFront: (id: string) => void;
  zIndex: number;
  canvasZoom: number;
  isPanning: boolean;
}

const ChartNodeContainer = styled.div<{ 
  $x: number; 
  $y: number; 
  $width: number; 
  $height: number; 
  $isDragging?: boolean;
  $zIndex: number;
  $active?: boolean;
}>`
  position: absolute;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  width: ${props => props.$width}px;
  height: ${props => props.$height}px;
  background: var(--color-surface);
  border-radius: 8px;
  box-shadow: ${props => props.$isDragging 
    ? props.theme.mode === 'dark' ? '0 8px 16px rgba(0,0,0,0.5)' : '0 8px 16px rgba(0,0,0,0.15)' 
    : props.$active 
      ? props.theme.mode === 'dark' ? '0 0 0 2px var(--color-primary), 0 2px 8px rgba(0,0,0,0.3)' : '0 0 0 2px var(--color-primary), 0 2px 8px rgba(0,0,0,0.1)'
      : props.theme.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'};
  display: flex;
  flex-direction: column;
  user-select: none;
  transition: box-shadow 0.2s ease;
  z-index: ${props => props.$isDragging ? 1000 : props.$zIndex};
  cursor: ${props => props.$isDragging ? 'grabbing' : 'pointer'};
`;

const NodeHeader = styled.div`
  padding: 8px 12px;
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  touch-action: none;
`;

const NodeTitle = styled.div`
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 8px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const NodeContent = styled.div`
  flex-grow: 1;
  position: relative;
  overflow: hidden;
  
  /* Make chart container properly sized */
  & > div {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Make Vega charts responsive */
  .vega-embed {
    width: 100% !important;
    height: 100% !important;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Ensure SVG expands to fill container */
  svg {
    width: 100% !important;
    height: 100% !important;
    max-width: 100%;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background-color: var(--color-surface-hover);
    color: var(--color-error);
  }
`;

const ResizeHandle = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  z-index: 10;
  touch-action: none;
  
  &::before {
    content: '';
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 8px;
    height: 8px;
    border-right: 2px solid var(--color-text-tertiary);
    border-bottom: 2px solid var(--color-text-tertiary);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 32px;
`;

const Notification = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: var(--color-primary);
  color: var(--color-surface);
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 1000;
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translateY(${props => props.$visible ? '0' : '-20px'});
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
`;

// Chart Node component - Fixing drag and resize functionality
const ChartNode: React.FC<ChartNodeProps> = ({ 
  chart, 
  onRemove, 
  onDragStart,
  onDragEnd,
  onPositionChange,
  onResize,
  bringToFront,
  zIndex,
  canvasZoom,
  isPanning
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [lineageData, setLineageData] = useState({
    source: chart.snapshot?.source || '',
    notes: chart.snapshot?.notes || '',
  });
  
  // Add memory refs to store starting positions for more accurate movement
  const dragMemory = useRef({
    startX: 0,
    startY: 0,
    chartStartX: 0,
    chartStartY: 0
  });
  
  const resizeMemory = useRef({
    startWidth: 0,
    startHeight: 0
  });
  
  // Render chart when component mounts
  useEffect(() => {
    if (contentRef.current && chart.snapshot?.spec) {
      try {
        renderVegaLite(contentRef.current, chart.snapshot.spec);
      } catch (error) {
        console.error('Failed to render chart:', error);
      }
    }
  }, [chart.snapshot?.spec]);
  
  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleInfoOpen = () => {
    setShowInfoDialog(true);
    handleMenuClose();
  };
  
  const handleInfoClose = () => {
    setShowInfoDialog(false);
  };
  
  const handleInfoSave = () => {
    // Here we would update the chart snapshot with the new lineage data
    // This requires adding an updateChartInfo function to the dashboard store
    useDashboardStore.getState().updateChartInfo(
      chart.id, 
      lineageData.source, 
      lineageData.notes
    );
    setShowInfoDialog(false);
  };
  
  // Fix unused variable warnings in the onDrag handlers
  const bindHeader = useGesture(
    {
      onDrag: ({ first, active, xy: [x, y], event }) => {
        if (isPanning) return;
        
        if (first) {
          // Store initial positions when drag starts
          dragMemory.current = {
            startX: x,
            startY: y,
            chartStartX: chart.x,
            chartStartY: chart.y
          };
          onDragStart();
          bringToFront(chart.id);
        }
        
        // Update position with damping
        if (active) {
          const dampingFactor = 0.5;
          
          // Calculate distance moved from starting position
          const deltaX = (x - dragMemory.current.startX) / canvasZoom * dampingFactor;
          const deltaY = (y - dragMemory.current.startY) / canvasZoom * dampingFactor;
          
          // Apply movement relative to starting chart position
          const newX = dragMemory.current.chartStartX + deltaX;
          const newY = dragMemory.current.chartStartY + deltaY;
          
          onPositionChange(chart.id, newX, newY);
        }
        
        if (!active && !first) {
          onDragEnd();
        }
        
        // Stop propagation
        if (event) {
          event.stopPropagation();
        }
      }
    },
    {
      drag: { 
        from: () => [0, 0],
        filterTaps: true,
        preventDefault: true
      }
    }
  );
  
  // Improve the resize gesture with memory
  const bindResize = useGesture(
    {
      onDrag: ({ first, active, movement: [mx, my], event }) => {
        if (isPanning) return;
        
        if (first) {
          // Store initial dimensions when resize starts
          resizeMemory.current = {
            startWidth: chart.width,
            startHeight: chart.height
          };
          bringToFront(chart.id);
        }
        
        // Update dimensions with damping
        if (active) {
          const dampingFactor = 0.3;
          
          // Apply resize relative to starting dimensions
          const deltaWidth = (mx / canvasZoom) * dampingFactor;
          const deltaHeight = (my / canvasZoom) * dampingFactor;
          
          const newWidth = Math.max(200, resizeMemory.current.startWidth + deltaWidth);
          const newHeight = Math.max(150, resizeMemory.current.startHeight + deltaHeight);
          
          onResize(chart.id, newWidth, newHeight);
        }
        
        // Stop propagation
        if (event) {
          event.stopPropagation();
        }
      }
    },
    {
      drag: {
        from: () => [0, 0],
        filterTaps: true,
        preventDefault: true
      }
    }
  );
  
  // Click handler to bring the chart to front
  const handleClick = (e: React.MouseEvent) => {
    if (isPanning) return;
    
    e.stopPropagation();
    bringToFront(chart.id);
    setIsActive(true);
    
    // Deactivate after a delay for visual feedback
    setTimeout(() => setIsActive(false), 1500);
  };
  
  return (
    <ChartNodeContainer 
      ref={nodeRef}
      $x={chart.x} 
      $y={chart.y}
      $width={chart.width}
      $height={chart.height}
      $isDragging={false}
      $zIndex={zIndex}
      $active={isActive}
      onClick={handleClick}
    >
      <NodeHeader {...bindHeader()}>
        <NodeTitle>{chart.snapshot?.name || 'Untitled Chart'}</NodeTitle>
        <HeaderActions>
          {chart.snapshot?.source && (
            <Tooltip title={`Source: ${chart.snapshot.source}`}>
              <InfoOutlinedIcon 
                fontSize="small" 
                style={{ color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '18px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleInfoOpen();
                }}
              />
            </Tooltip>
          )}
          <ActionButton 
            onClick={handleMenuOpen}
            style={{ padding: '2px' }}
          >
            <MoreVertIcon fontSize="small" />
          </ActionButton>
        </HeaderActions>
      </NodeHeader>
      <NodeContent ref={contentRef} />
      <ResizeHandle {...bindResize()} />
      
      {/* Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          style: {
            minWidth: '160px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }
        }}
      >
        <MenuItem onClick={handleInfoOpen}>
          <InfoOutlinedIcon fontSize="small" style={{ marginRight: '8px' }} />
          Data Source Info
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          onRemove(chart.id);
        }}>
          <DeleteOutlineIcon fontSize="small" style={{ marginRight: '8px' }} />
          Remove Chart
        </MenuItem>
      </Menu>
      
      {/* Data Lineage Dialog */}
      <Dialog 
        open={showInfoDialog} 
        onClose={handleInfoClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chart Data Source</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Source File/Dataset"
            fullWidth
            variant="outlined"
            value={lineageData.source}
            onChange={(e) => setLineageData({...lineageData, source: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Notes/Context"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={lineageData.notes}
            onChange={(e) => setLineageData({...lineageData, notes: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleInfoClose}>Cancel</Button>
          <Button onClick={handleInfoSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </ChartNodeContainer>
  );
};

export const CanvasView: React.FC = () => {
  const { 
    currentDashboard, 
    removeChart,
    updateChartPosition,
    updateChartDimensions,
    addChart,
    snapshots,
    canvasZoom,
    canvasOffsetX,
    canvasOffsetY,
    setCanvasTransform
  } = useDashboardStore();
  
  const [showChartSelector, setShowChartSelector] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingChart, setIsDraggingChart] = useState(false);
  const [zIndexes, setZIndexes] = useState<Record<string, number>>({});
  const [notification, setNotification] = useState<{ visible: boolean, message: string }>({ 
    visible: false, 
    message: '' 
  });
  const [showPanCue, setShowPanCue] = useState(false);
  const lastPanPosition = useRef({ x: 0, y: 0 });
  
  // Handle keyboard events for space bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isPanning) {
        setIsPanning(true);
        setShowPanCue(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isPanning) {
        setIsPanning(false);
        setShowPanCue(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning]);
  
  // Set up canvas pan and zoom gestures
  const bind = useGesture(
    {
      onDrag: ({ movement: [mx, my], first, last, event }) => {
        // Only enable drag when space is pressed (isPanning is true) and no chart is being dragged
        if (!isPanning || isDraggingChart) return;
        
        if (first) {
          lastPanPosition.current = { x: 0, y: 0 };
        }
        
        // Calculate the delta since last update
        const deltaX = (mx as number) - lastPanPosition.current.x;
        const deltaY = (my as number) - lastPanPosition.current.y;
        
        // Update last position
        lastPanPosition.current = { x: mx as number, y: my as number };
        
        setCanvasTransform(
          canvasZoom,
          canvasOffsetX + deltaX / canvasZoom,
          canvasOffsetY + deltaY / canvasZoom
        );
      },
      onWheel: ({ delta: [, dy] }) => {
        if (!canvasRef.current) return;
        
        const delta = -(dy as number) * 0.001;
        const newZoom = Math.max(0.1, Math.min(2, canvasZoom + delta));
        
        setCanvasTransform(newZoom, canvasOffsetX, canvasOffsetY);
      }
    },
    {
      drag: {
        from: () => [0, 0]
      }
    }
  );
  
  // Handle chart drag start/end
  const handleChartDragStart = () => {
    setIsDraggingChart(true);
  };
  
  const handleChartDragEnd = () => {
    setIsDraggingChart(false);
  };
  
  const handleAddChart = () => {
    setShowChartSelector(true);
  };
  
  const handleChartSelect = (snapshot: any) => {
    // Place the chart in the center of the visible canvas
    const x = -canvasOffsetX + 500 / canvasZoom;
    const y = -canvasOffsetY + 300 / canvasZoom;
    
    addChart(snapshot, x, y, 400, 300);
    setShowChartSelector(false);
    
    // Show notification
    setNotification({
      visible: true,
      message: `Added "${snapshot.name}" to canvas`
    });
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  const resetView = () => {
    // Reset to default zoom and center position
    setCanvasTransform(1, 0, 0);

    // Also reset any tracking variables related to panning
    lastPanPosition.current = { x: 0, y: 0 };
    setIsPanning(false);
  };
  
  // Function to bring a chart to the front by updating its z-index
  const bringToFront = (chartId: string) => {
    setZIndexes(prev => {
      const highestZ = Object.values(prev).reduce((max, z) => Math.max(max, z), 0);
      return { ...prev, [chartId]: highestZ + 1 };
    });
  };
  
  // Initialize z-indexes when dashboard changes
  useEffect(() => {
    if (!currentDashboard) return;
    
    // Set initial z-indexes based on chart order
    const initialZIndexes: Record<string, number> = {};
    currentDashboard.charts.forEach((chart, index) => {
      initialZIndexes[chart.id] = index + 1;
    });
    
    setZIndexes(initialZIndexes);
  }, [currentDashboard?.id]);

  // Handle canvas click to deselect all charts
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-surface')) {
      // Only handle direct clicks on the canvas, not bubbled events from charts
      // Logic for canvas click if needed
    }
  };
  
  if (!currentDashboard) {
    return (
      <EmptyState>
        <p>No dashboard selected. Create a new one or select an existing one.</p>
      </EmptyState>
    );
  }
  
  return (
    <>
      <CanvasContainer ref={canvasRef} {...bind()} onClick={handleCanvasClick}>
        <CanvasSurface 
          className="canvas-surface"
          $zoom={canvasZoom} 
          $offsetX={canvasOffsetX} 
          $offsetY={canvasOffsetY}
          $isDragging={false}
          $isPanning={isPanning}
        >
          {currentDashboard.charts.map(chart => (
            <ChartNode 
              key={chart.id} 
              chart={chart}
              onRemove={removeChart}
              onDragStart={handleChartDragStart}
              onDragEnd={handleChartDragEnd}
              onPositionChange={updateChartPosition}
              onResize={updateChartDimensions}
              bringToFront={bringToFront}
              zIndex={zIndexes[chart.id] || 1}
              canvasZoom={canvasZoom}
              isPanning={isPanning}
            />
          ))}
        </CanvasSurface>
        
        <CanvasControls>
          <CanvasButton 
            onClick={handleAddChart} 
            title="Add Chart" 
            className="add-chart"
          >
            <AddIcon fontSize="medium" />
          </CanvasButton>
          <CanvasButton onClick={resetView} title="Reset View">
            <span style={{ fontSize: '18px' }}>🔍</span>
          </CanvasButton>
        </CanvasControls>
        
        {showPanCue && (
          <PanCue>
            Panning Mode (Space + Mouse)
          </PanCue>
        )}
      </CanvasContainer>
      
      {showChartSelector && (
        <ChartSelector 
          snapshots={snapshots}
          onSelect={handleChartSelect}
          onClose={() => setShowChartSelector(false)}
        />
      )}

      {/* Show instruction for new users */}
      {currentDashboard.charts.length > 0 && currentDashboard.charts.length < 3 && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '30px',
          background: 'rgba(52, 58, 64, 0.9)',
          color: 'var(--color-surface)',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 40,
          maxWidth: '280px',
          fontSize: '0.9rem',
          lineHeight: '1.5'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Canvas Controls:</div>
          • Click directly on a chart to select and move it<br />
          • Hold SPACE + click & drag to pan the canvas<br />
          • Use the resize handle in the bottom-right corner of charts
        </div>
      )}
      
      {/* Notification when a chart is added */}
      <Notification $visible={notification.visible}>
        {notification.message}
      </Notification>
    </>
  );
}; 