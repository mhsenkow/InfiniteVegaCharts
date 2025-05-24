import styled from 'styled-components'
import { CodeEditor } from './CodeEditor'
import { Preview } from './Preview'
import { chartSpecs } from '../../charts'
import { useState, useRef, useEffect } from 'react'
import { VisualEditor } from './VisualEditor'
import { StyleEditor } from './StyleEditor'
import { theme } from '../../types/theme'
import { ErrorBoundary } from '../ErrorBoundary'
import { DataCurationPanel } from './DataCurationPanel'
import { DatasetMetadata } from '../../types/dataset'
import { TopLevelSpec } from 'vega-lite'
import BrushIcon from '@mui/icons-material/Brush';
import TuneIcon from '@mui/icons-material/Tune';
import CodeIcon from '@mui/icons-material/Code';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { ExtendedSpec } from '../../types/vega';
import { SnapshotPanel } from './SnapshotPanel';
import { CanvasArea } from '../Canvas/CanvasArea';

const Container = styled.div`
  position: relative;
  height: calc(100vh - 80px);
  background: var(--color-surface);
  border-radius: 20px;
  box-shadow: 0 2px 4px ${props => props.theme.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'};
  overflow: hidden;
  margin-left: 0;
`

const EditorPanel = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: ${props => props.$isVisible ? '0' : '-408px'};
  bottom: 0;
  width: 420px;
  overflow-y: auto;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 8px ${props => props.theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'};
  background: var(--color-background);
  z-index: 10;
  transition: left 0.3s ease-in-out;

  &::-webkit-scrollbar {
    width: 6px;
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
`

const PreviewPanel = styled.div<{ $sidebarVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0px;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-left: 0px;
  transition: margin-left 0.3s ease;
`

const PreviewContent = styled.div`
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 16px;
`

const BackButton = styled.button`
  margin-bottom: 24px;
  padding: 10px 20px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  &::before {
    content: "←";
    font-size: 1.2em;
  }
`

const TabContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
  padding: 8px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 5%;
    width: 90%;
    height: 1px;
    background: var(--color-border);
  }
`

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${props => props.$active ? 'rgba(var(--color-primary-rgb), 0.12)' : 'transparent'};
  border: none;
  border-radius: 6px;
  color: ${props => props.$active ? 'var(--color-primary)' : 'var(--color-text-secondary)'};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: ${props => props.$active ? 'rgba(var(--color-primary-rgb), 0.12)' : 'var(--color-surface-hover)'};
    
    &::after {
      content: attr(data-tooltip);
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'};
      color: ${props => props.theme.mode === 'dark' ? 'black' : 'white'};
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      white-space: nowrap;
      pointer-events: none;
      margin-top: 5px;
      z-index: 100;
    }
  }

  svg {
    font-size: 20px;
  }
`

const ToggleButtonTooltip = styled.div`
  position: absolute;
  left: 30px;
  top: 50%;
  transform: translateY(-50%);
  background: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'};
  color: ${props => props.theme.mode === 'dark' ? 'black' : 'white'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 20;
`

const ToggleButton = styled.button<{ $isVisible: boolean }>`
  position: fixed;
  left: ${props => props.$isVisible ? '0px' : '0'};
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 60px;
  background: rgba(var(--color-primary-rgb), 0.1);
  border: 1px solid rgba(var(--color-primary-rgb), 0.3);
  border-left: ${props => props.$isVisible ? '1px solid rgba(var(--color-primary-rgb), 0.3)' : 'none'};
  border-radius: ${props => props.$isVisible ? '0 4px 4px 0' : '0 4px 4px 0'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 11;
  transition: all 0.3s ease;
  box-shadow: 1px 0 3px ${props => props.theme.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'};
  color: var(--color-primary);
  position: relative;

  &:hover {
    background: rgba(var(--color-primary-rgb), 0.2);
    
    ${ToggleButtonTooltip} {
      opacity: 1;
    }
  }

  svg {
    width: 10px;
    height: 10px;
    transform: rotate(${props => props.$isVisible ? '180deg' : '0deg'});
    transition: transform 0.3s ease;
  }
`

/**
 * Main editor layout component that provides the interface for customizing charts.
 * Includes tabs for visual editing, styling, and code editing.
 */

interface EditorLayoutProps {
  chartId: string;
  onBack: () => void;
}

export const EditorLayout = ({ chartId, onBack }: EditorLayoutProps) => {
  const [spec, setSpec] = useState(() => {
    try {
      const initialSpec = chartSpecs[chartId as keyof typeof chartSpecs];
      return JSON.stringify(initialSpec || {}, null, 2);
    } catch (e) {
      console.error('Error parsing initial spec:', e);
      return '{}';
    }
  });
  const [mode, setMode] = useState<'visual' | 'style' | 'code' | 'snapshots' | 'canvas'>('visual');
  const [dataset, setDataset] = useState<DatasetMetadata | null>(null);
  const [chartRenderKey, setChartRenderKey] = useState(0);
  const [vegaView, setVegaView] = useState<any>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(() => {
    const saved = localStorage.getItem('editorPanelVisible');
    return saved !== null ? saved === 'true' : true;
  });

  // Save panel visibility state to localStorage
  useEffect(() => {
    localStorage.setItem('editorPanelVisible', isPanelVisible.toString());
  }, [isPanelVisible]);

  const handleVisualChange = (updates: Partial<ExtendedSpec>) => {
    // Ensure mark configurations are properly serialized
    const serializedSpec = {
      ...updates,
      mark: typeof updates.mark === 'string' ? updates.mark : {
        ...updates.mark,
        // Ensure these properties are included in the JSON
        ...(updates.mark?.type === 'point' && {
          type: 'point',
          size: updates.mark.size,
          filled: updates.mark.filled,
          shape: updates.mark.shape,
          stroke: updates.mark.stroke,
          strokeWidth: updates.mark.strokeWidth
        }),
        // Add other mark-specific configurations
        ...(updates.mark?.type === 'line' && {
          point: updates.mark.point,
          interpolate: updates.mark.interpolate
        }),
        ...(updates.mark?.type === 'area' && {
          line: updates.mark.line,
          opacity: updates.mark.opacity
        }),
        ...(updates.mark?.type === 'bar' && {
          cornerRadius: updates.mark.cornerRadius
        })
      }
    };

    // Update the code editor with properly formatted JSON
    setSpec(JSON.stringify(serializedSpec, null, 2));
  }

  const updateChartRender = () => {
    console.log('Updating chart render key from:', chartRenderKey);
    setChartRenderKey(prev => prev + 1);
  };

  useEffect(() => {
    try {
      const parsedSpec = JSON.parse(spec);
      if (parsedSpec && Object.keys(parsedSpec).length > 0) {
        const timeoutId = setTimeout(() => {
          updateChartRender();
        }, 10);
        return () => clearTimeout(timeoutId);
      }
    } catch (e) {
      console.error('Invalid spec:', e);
    }
  }, [spec]);

  const handleVegaViewUpdate = (view: any) => {
    console.log('EditorLayout received vegaView update:', view ? 'View present' : 'No view');
    setVegaView(view);
  };

  // When changing tabs, make sure to re-render the chart if needed
  useEffect(() => {
    if (mode === 'snapshots') {
      console.log('Snapshots tab selected, forcing chart activation');
      // Always force a re-render when switching to snapshots tab
      // This ensures the view is available regardless of current state
      updateChartRender();
      
      // Give it a moment to render before checking if we need to try again
      const timeoutId = setTimeout(() => {
        if (!vegaView) {
          console.log('View still not available after initial render, trying again');
          updateChartRender();
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [mode, vegaView, updateChartRender]);

  // Add keyboard shortcut to toggle panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar with Ctrl+B or Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsPanelVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div>
      <BackButton onClick={onBack}>Back to Gallery</BackButton>
      <Container>
        <EditorPanel $isVisible={isPanelVisible}>
          <TabContainer>
            <Tab 
              $active={mode === 'visual'} 
              onClick={() => setMode('visual')}
              data-tooltip="Data"
            >
              <TuneIcon />
            </Tab>
            <Tab 
              $active={mode === 'style'} 
              onClick={() => setMode('style')}
              data-tooltip="Style"
            >
              <BrushIcon />
            </Tab>
            <Tab 
              $active={mode === 'code'} 
              onClick={() => setMode('code')}
              data-tooltip="Code"
            >
              <CodeIcon />
            </Tab>
            <Tab 
              $active={mode === 'snapshots'} 
              onClick={() => setMode('snapshots')}
              data-tooltip="Snapshots"
            >
              <CameraAltIcon />
            </Tab>
            <Tab 
              $active={mode === 'canvas'} 
              onClick={() => setMode('canvas')}
              data-tooltip="Canvas"
            >
              <DashboardIcon />
            </Tab>
          </TabContainer>

          {mode === 'visual' && dataset && (
            <ErrorBoundary>
              <DataCurationPanel 
                dataset={dataset}
                onDatasetUpdate={setDataset}
              />
            </ErrorBoundary>
          )}

          <ErrorBoundary>
            {mode === 'code' ? (
              <CodeEditor value={spec} onChange={setSpec} />
            ) : mode === 'style' ? (
              <StyleEditor spec={JSON.parse(spec)} onChange={handleVisualChange} />
            ) : mode === 'snapshots' ? (
              <>
                {!vegaView && (
                  <div style={{
                    padding: '10px',
                    margin: '0 0 16px 0',
                    backgroundColor: 'var(--sampling-indicator-bg)',
                    color: 'var(--sampling-indicator-text)',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}>
                    Chart not fully initialized. Please click on the chart area to activate it.
                  </div>
                )}
                <SnapshotPanel 
                  chartId={chartId}
                  currentSpec={JSON.parse(spec)}
                  vegaView={vegaView}
                  onLoadSnapshot={(loadedSpec) => {
                    setSpec(JSON.stringify(loadedSpec, null, 2));
                  }}
                />
              </>
            ) : mode === 'canvas' ? (
              <CanvasArea />
            ) : (
              <ErrorBoundary>
                <VisualEditor
                  spec={JSON.parse(spec) as ExtendedSpec}
                  onChange={handleVisualChange}
                  onChartRender={updateChartRender}
                />
              </ErrorBoundary>
            )}
          </ErrorBoundary>
        </EditorPanel>
        <ToggleButton 
          onClick={() => setIsPanelVisible(!isPanelVisible)} 
          $isVisible={isPanelVisible}
          aria-label={isPanelVisible ? "Hide panel" : "Show panel"}
        >
          <ToggleButtonTooltip>
            {isPanelVisible ? "Hide Panel (⌘B)" : "Show Panel (⌘B)"}
          </ToggleButtonTooltip>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </ToggleButton>
        <PreviewPanel $sidebarVisible={isPanelVisible}>
          <ErrorBoundary>
            <PreviewContent>
              <Preview 
                spec={spec} 
                renderKey={chartRenderKey}
                onVegaViewUpdate={handleVegaViewUpdate}
              />
            </PreviewContent>
          </ErrorBoundary>
        </PreviewPanel>
      </Container>
    </div>
  )
}
