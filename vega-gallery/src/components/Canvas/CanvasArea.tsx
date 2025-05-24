import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { getAllSnapshots, Snapshot, Canvas, CanvasSlot as DBCanvasSlot, storeCanvas, getAllCanvases, getCanvas, deleteCanvas } from '../../utils/indexedDB';
import { renderVegaLite } from '../../utils/chartRenderer';

// Other styled components defined elsewhere in the file

const CanvasContainer = styled.div`
  padding: 20px;
  background: var(--color-surface);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  position: relative;
`;

const CanvasTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--color-text-primary);
  font-size: 1.1rem;
`;

const DashboardCanvas = styled.div<{ $rows: number; $height: number }>`
  background-color: var(--color-background);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  min-height: ${props => props.$height}px;
  position: relative;
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(${props => props.$rows}, 1fr);
  gap: 16px;
  padding: 16px;
  transition: min-height 0.3s ease;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(${props => props.$rows * 2}, 1fr);
  }
`;

const ChartSlot = styled.div<{ $isResizing?: boolean }>`
  background-color: var(--color-surface);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 250px;
  transition: ${props => props.$isResizing ? 'none' : 'box-shadow 0.2s ease'};
  position: relative;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ChartHeader = styled.div`
  padding: 8px 12px;
  background-color: var(--color-surfaceHover);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChartTitle = styled.div`
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--color-text-primary);
`;

const ChartContent = styled.div`
  flex-grow: 1;
  padding: 12px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;

  /* Make chart container properly sized */
  & > div {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
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

const EmptySlot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-tertiary);
  font-size: 0.9rem;
  text-align: center;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--color-surfaceHover);
  }
`;

const SnapshotSelector = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 16px;
`;

const SnapshotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  overflow-y: auto;
  padding: 16px;
  max-height: 400px;
`;

const SnapshotCard = styled.div`
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const SnapshotThumbnail = styled.div`
  height: 100px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
`;

const SnapshotName = styled.div`
  padding: 8px;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: var(--color-background);
  }
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  background: ${props => props.$primary ? props.theme.colors.primary : '#f1f3f5'};
  color: ${props => props.$primary ? 'white' : props.theme.colors.text.primary};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-bottom: 16px;
  
  &:hover {
    background: ${props => props.$primary ? '#1976d2' : '#e9ecef'};
  }
`;

const RefreshButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 6px;
  
  svg {
    font-size: 16px;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SpinnerIcon = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--color-surface);
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Add components for canvas management
const CanvasControls = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const CanvasSelector = styled.select`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  font-size: 0.9rem;
  min-width: 200px;
`;

const CanvasNameInput = styled.input`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  font-size: 0.9rem;
  min-width: 200px;
  flex: 1;
`;

// Resize handle for canvas height
const ResizeHandle = styled.div`
  width: 100%;
  height: 12px;
  background: transparent;
  cursor: ns-resize;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  margin-top: -6px;
  position: relative;
  z-index: 10;

  &::after {
    content: '';
    width: 60px;
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    opacity: 0.7;
    transition: all 0.2s ease;
  }

  &:hover::after {
    opacity: 1;
    transform: scaleY(1.5);
    background: var(--color-text-tertiary);
  }

  &:active::after {
    opacity: 1;
    background: var(--color-primary);
    transform: scaleY(1.5);
  }
`;

// Row controls
const RowControls = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 16px;
  gap: 8px;
`;

const CircleButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: var(--color-surface);
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
  
  &:disabled {
    background: var(--color-border);
    color: var(--color-text-tertiary);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// Updated component type for slots
interface SlotState {
  id: string;
  snapshot: Snapshot | null;
  chartRef: React.RefObject<HTMLDivElement>;
  viewRef: React.MutableRefObject<any>;
}

// Create default slots for a grid with specified rows
const createDefaultSlots = (rows: number): SlotState[] => {
  return Array.from({ length: rows * 2 }, (_, i) => ({
    id: `slot-${i}`,
    snapshot: null,
    chartRef: React.createRef<HTMLDivElement>(),
    viewRef: React.createRef<any>()
  })) as SlotState[];
};

// Max allowed rows
const MAX_ROWS = 6;

export const CanvasArea = () => {
  const [rows, setRows] = useState(2);
  const [slots, setSlots] = useState<SlotState[]>(createDefaultSlots(rows));
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasName, setCanvasName] = useState('My Dashboard');
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startY: 0, startHeight: 0 });
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  // Handle canvas resize drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startY: e.clientY,
      startHeight: canvasHeight
    };
    document.body.style.cursor = 'ns-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const delta = e.clientY - dragRef.current.startY;
    const newHeight = Math.max(300, Math.min(1500, dragRef.current.startHeight + delta));
    setCanvasHeight(newHeight);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Add or remove rows
  const addRow = () => {
    if (rows >= MAX_ROWS) return;
    
    const newRows = rows + 1;
    setRows(newRows);
    
    // Add two new slots (one for each column)
    const newSlots = [...slots];
    const nextSlotIndex = newSlots.length;
    
    newSlots.push({
      id: `slot-${nextSlotIndex}`,
      snapshot: null,
      chartRef: React.createRef<HTMLDivElement>(),
      viewRef: React.createRef<any>()
    });
    
    newSlots.push({
      id: `slot-${nextSlotIndex + 1}`,
      snapshot: null,
      chartRef: React.createRef<HTMLDivElement>(),
      viewRef: React.createRef<any>()
    });
    
    setSlots(newSlots);
  };

  const removeRow = () => {
    if (rows <= 1) return;
    
    const newRows = rows - 1;
    setRows(newRows);
    
    // Remove last two slots (one from each column)
    const newSlots = [...slots];
    newSlots.splice(-2, 2);
    
    setSlots(newSlots);
  };
  
  // Load snapshots and canvases on mount
  useEffect(() => {
    loadSnapshots();
    loadCanvases();

    // Create a ResizeObserver to handle responsive chart resizing
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const slotIndex = slots.findIndex(
          slot => slot.chartRef.current === entry.target
        );
        
        if (slotIndex >= 0 && slots[slotIndex].snapshot) {
          renderChartInSlot(slots[slotIndex], slots[slotIndex].snapshot!);
        }
      }
    });

    return () => {
      // Clean up the observer
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      
      // Clean up any Vega views
      slots.forEach(slot => {
        if (slot.viewRef?.current) {
          try {
            slot.viewRef.current.finalize();
          } catch (e) {
            console.error('Error cleaning up Vega view:', e);
          }
        }
      });

      // Clean up resize event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  // Re-render charts when slots change
  useEffect(() => {
    // First, disconnect existing observers
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }
    
    // Render charts in their slots
    slots.forEach((slot) => {
      if (slot.snapshot && slot.chartRef.current) {
        renderChartInSlot(slot, slot.snapshot);
        
        // Observe the chart container for size changes
        if (resizeObserverRef.current && slot.chartRef.current) {
          resizeObserverRef.current.observe(slot.chartRef.current);
        }
      }
    });
  }, [slots]);
  
  // Update event listeners when handlers change
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  // Load existing canvases from database
  const loadCanvases = async () => {
    try {
      setIsLoading(true);
      const allCanvases = await getAllCanvases();
      setCanvases(allCanvases);
      
      // If canvases exist, select the first one by default
      if (allCanvases.length > 0 && !selectedCanvasId) {
        setSelectedCanvasId(allCanvases[0].id);
        await loadCanvas(allCanvases[0].id);
      }
    } catch (error) {
      console.error('Failed to load canvases:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load a specific canvas by ID
  const loadCanvas = async (canvasId: string) => {
    if (!canvasId) return;
    
    try {
      setIsLoading(true);
      const canvas = await getCanvas(canvasId);
      
      if (canvas) {
        setCanvasName(canvas.name);
        
        // If canvas has a custom height, use it
        if (canvas.height) {
          setCanvasHeight(canvas.height);
        }
        
        // If canvas has a custom row count, use it
        const canvasRows = Math.ceil(canvas.slots.length / 2);
        if (canvasRows !== rows) {
          setRows(canvasRows);
        }
        
        // Create new slots based on the canvas data
        const newSlots = createDefaultSlots(canvasRows);
        
        // Load snapshots for each slot
        for (const canvasSlot of canvas.slots) {
          if (canvasSlot.snapshotId && canvasSlot.position >= 0 && canvasSlot.position < newSlots.length) {
            const snapshot = snapshots.find(s => s.id === canvasSlot.snapshotId) || null;
            if (snapshot) {
              newSlots[canvasSlot.position].snapshot = snapshot;
            }
          }
        }
        
        setSlots(newSlots);
      }
    } catch (error) {
      console.error('Failed to load canvas:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save the current canvas layout
  const saveCanvas = async () => {
    try {
      setIsSaving(true);
      
      // Create canvas slots from the current state
      const canvasSlots: DBCanvasSlot[] = slots.map((slot, index) => ({
        id: slot.id,
        position: index,
        snapshotId: slot.snapshot ? slot.snapshot.id : null
      }));
      
      // Create canvas object with height and row information
      const canvas: Canvas = {
        id: selectedCanvasId || `canvas-${Date.now()}`,
        name: canvasName,
        slots: canvasSlots,
        height: canvasHeight,
        rows: rows,
        createdAt: selectedCanvasId ? 
          canvases.find(c => c.id === selectedCanvasId)?.createdAt || new Date().toISOString() : 
          new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store in database
      await storeCanvas(canvas);
      
      // If this is a new canvas, add it to the list and select it
      if (!selectedCanvasId) {
        setCanvases(prev => [...prev, canvas]);
        setSelectedCanvasId(canvas.id);
      } else {
        // Update the canvas in the list
        setCanvases(prev => 
          prev.map(c => c.id === canvas.id ? canvas : c)
        );
      }
      
      alert('Canvas saved successfully!');
    } catch (error) {
      console.error('Failed to save canvas:', error);
      alert('Failed to save canvas: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };
  
  // Create a new empty canvas
  const createNewCanvas = () => {
    setCanvasName('New Dashboard');
    setSlots(createDefaultSlots(rows));
    setSelectedCanvasId('');
  };
  
  // Delete the selected canvas
  const deleteSelectedCanvas = async () => {
    if (!selectedCanvasId) return;
    
    if (window.confirm(`Are you sure you want to delete "${canvasName}"?`)) {
      try {
        setIsLoading(true);
        await deleteCanvas(selectedCanvasId);
        
        // Remove from list and reset selection
        setCanvases(prev => prev.filter(c => c.id !== selectedCanvasId));
        setSelectedCanvasId('');
        setSlots(createDefaultSlots(rows));
        setCanvasName('New Dashboard');
        
        alert('Canvas deleted successfully!');
      } catch (error) {
        console.error('Failed to delete canvas:', error);
        alert('Failed to delete canvas: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Handle canvas selection change
  const handleCanvasChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const canvasId = e.target.value;
    setSelectedCanvasId(canvasId);
    
    if (canvasId) {
      loadCanvas(canvasId);
    } else {
      // Create a new canvas
      createNewCanvas();
    }
  };
  
  const loadSnapshots = async () => {
    try {
      setIsLoading(true);
      const allSnapshots = await getAllSnapshots();
      setSnapshots(allSnapshots);
    } catch (error) {
      console.error('Failed to load snapshots:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderChartInSlot = async (slot: SlotState, snapshot: Snapshot) => {
    if (!slot.chartRef.current) return;
    
    try {
      // Clean up previous view if it exists
      if (slot.viewRef?.current) {
        try {
          slot.viewRef.current.finalize();
          slot.viewRef.current = null;
        } catch (e) {
          console.error('Error cleaning up previous view:', e);
        }
      }
      
      // Clear previous content
      slot.chartRef.current.innerHTML = '';
      
      // Create a wrapper div for proper sizing
      const wrapper = document.createElement('div');
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      slot.chartRef.current.appendChild(wrapper);
      
      // Prepare spec with proper sizing
      const responsiveSpec = {
        ...snapshot.spec,
        width: 'container',
        height: 'container',
        autosize: {
          type: 'fit',
          contains: 'padding'
        }
      };
      
      // Render the chart
      const view = await renderVegaLite(wrapper, responsiveSpec);
      
      // Store the view reference
      if (slot.viewRef) {
        slot.viewRef.current = view;
      }
    } catch (error) {
      console.error('Failed to render chart in slot:', error);
      if (slot.chartRef.current) {
        slot.chartRef.current.innerHTML = `
          <div style="color: red; padding: 16px; text-align: center;">
            Failed to render chart: ${error instanceof Error ? error.message : 'Unknown error'}
          </div>
        `;
      }
    }
  };
  
  const handleSlotClick = (index: number) => {
    setActiveSlotIndex(index);
  };
  
  const handleSnapshotSelect = (snapshot: Snapshot) => {
    if (activeSlotIndex !== null) {
      setSlots(prev => {
        const newSlots = [...prev];
        newSlots[activeSlotIndex] = {
          ...newSlots[activeSlotIndex],
          snapshot
        };
        return newSlots;
      });
      setActiveSlotIndex(null);
    }
  };
  
  const handleClearSlot = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Clean up the view if it exists
    if (slots[index].viewRef?.current) {
      try {
        slots[index].viewRef.current.finalize();
      } catch (e) {
        console.error('Error cleaning up view:', e);
      }
    }
    
    setSlots(prev => {
      const newSlots = [...prev];
      newSlots[index] = {
        ...newSlots[index],
        snapshot: null,
        viewRef: { current: null }
      };
      return newSlots;
    });
  };
  
  const closeSelector = () => {
    setActiveSlotIndex(null);
  };
  
  return (
    <CanvasContainer>
      <CanvasTitle>Dashboard Canvas</CanvasTitle>
      
      <CanvasControls>
        <CanvasSelector 
          value={selectedCanvasId} 
          onChange={handleCanvasChange}
          disabled={isLoading}
        >
          <option value="">-- New Canvas --</option>
          {canvases.map(canvas => (
            <option key={canvas.id} value={canvas.id}>
              {canvas.name}
            </option>
          ))}
        </CanvasSelector>
        
        <CanvasNameInput
          type="text"
          value={canvasName}
          onChange={(e) => setCanvasName(e.target.value)}
          placeholder="Dashboard Name"
          disabled={isLoading}
        />
        
        <Button 
          $primary
          onClick={saveCanvas}
          disabled={isLoading || isSaving || !canvasName.trim()}
        >
          {isSaving ? (
            <>
              <SpinnerIcon /> Saving...
            </>
          ) : (
            'Save Canvas'
          )}
        </Button>
        
        {selectedCanvasId && (
          <Button
            onClick={deleteSelectedCanvas}
            disabled={isLoading}
            style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}
          >
            Delete
          </Button>
        )}
        
        <RefreshButton 
          $primary 
          onClick={loadSnapshots}
          disabled={isLoading}
          style={{ marginLeft: 'auto' }}
        >
          {isLoading ? (
            <>
              <SpinnerIcon /> Loading...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">
                <path fill="currentColor" d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160H336c-13.3 0-24 10.7-24 24s10.7 24 24 24h128c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24s-24 10.7-24 24v51.2L418.7 85.9c-76.1-76.1-199.4-76.1-275.4 0C73.2 155.9 52.9 229 66.6 297h38.4c-7-22.9-8.5-47-2.1-70.5zM445.4 215c7 22.9 8.5 47 2.1 70.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0L166.3 352H216c13.3 0 24-10.7 24-24s-10.7-24-24-24H88c-13.3 0-24 10.7-24 24V456c0 13.3 10.7 24 24 24s24-10.7 24-24V404.8l21.2 21.2c76.1 76.1 199.4 76.1 275.4 0c70.1-70.1 90.4-143.2 76.7-211H445.4z"/>
              </svg>
              Refresh Snapshots
            </>
          )}
        </RefreshButton>
      </CanvasControls>
      
      <DashboardCanvas $rows={rows} $height={canvasHeight}>
        {slots.map((slot, index) => (
          <ChartSlot key={slot.id} onClick={() => handleSlotClick(index)}>
            {slot.snapshot ? (
              <>
                <ChartHeader>
                  <ChartTitle>{slot.snapshot.name}</ChartTitle>
                  <button 
                    onClick={(e) => handleClearSlot(index, e)}
                                          style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: 'var(--color-text-secondary)'
                      }}
                  >
                    ×
                  </button>
                </ChartHeader>
                <ChartContent ref={slot.chartRef} />
              </>
            ) : (
              <EmptySlot>
                <div>Click to add a chart</div>
                <div style={{ fontSize: '2rem', marginTop: '8px' }}>+</div>
              </EmptySlot>
            )}
          </ChartSlot>
        ))}
      </DashboardCanvas>
      
      {/* Canvas resize handle */}
      <ResizeHandle onMouseDown={handleMouseDown} />
      
      {/* Row controls */}
      <RowControls>
        <CircleButton 
          onClick={removeRow} 
          disabled={rows <= 1 || isLoading}
          title="Remove row"
        >
          -
        </CircleButton>
        <CircleButton 
          onClick={addRow} 
          disabled={rows >= MAX_ROWS || isLoading}
          title="Add row"
        >
          +
        </CircleButton>
      </RowControls>
      
      {activeSlotIndex !== null && (
        <SnapshotSelector>
          <CanvasTitle>Select a Snapshot</CanvasTitle>
          <CloseButton onClick={closeSelector}>×</CloseButton>
          
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              Loading snapshots...
            </div>
          ) : snapshots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              No snapshots available. Create some snapshots first.
            </div>
          ) : (
            <SnapshotGrid>
              {snapshots.map(snapshot => (
                <SnapshotCard 
                  key={snapshot.id}
                  onClick={() => handleSnapshotSelect(snapshot)}
                >
                  <SnapshotThumbnail 
                    style={{ backgroundImage: `url(${snapshot.thumbnail})` }}
                  />
                  <SnapshotName>{snapshot.name}</SnapshotName>
                </SnapshotCard>
              ))}
            </SnapshotGrid>
          )}
        </SnapshotSelector>
      )}
    </CanvasContainer>
  );
}; 