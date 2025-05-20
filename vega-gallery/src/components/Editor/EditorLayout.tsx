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
import { ExtendedSpec } from '../../types/vega';

const Container = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 400px) 1fr;
  gap: 12px;
  height: calc(100vh - 80px);
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
`

const EditorPanel = styled.div`
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid ${props => props.theme.colors.border};
  padding-right: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: inset 0 -10px 10px -10px rgba(0, 0, 0, 0.05);

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
    
    &:hover {
      background: #bbb;
    }
  }
`

const PreviewPanel = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const PreviewContent = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
`

const BackButton = styled.button`
  margin-bottom: 24px;
  padding: 10px 20px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f3f5;
    color: #2c3e50;
  }

  &::before {
    content: "←";
    font-size: 1.2em;
  }
`

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
`

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: ${props => props.$active ? props.theme.colors.primary + '20' : 'transparent'};
  border: none;
  border-radius: 6px;
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.text.secondary};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;

  &:hover {
    background: ${props => props.$active ? props.theme.colors.primary + '20' : '#f1f3f5'};
  }

  svg {
    font-size: 18px;
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
  const [mode, setMode] = useState<'visual' | 'style' | 'code'>('visual')
  const [dataset, setDataset] = useState<DatasetMetadata | null>(null)
  const [chartRenderKey, setChartRenderKey] = useState(0);

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

  return (
    <div>
      <BackButton onClick={onBack}>Back to Gallery</BackButton>
      <Container>
        <EditorPanel>
          <TabContainer>
            <Tab 
              $active={mode === 'visual'} 
              onClick={() => setMode('visual')}
            >
              <TuneIcon />
              Data
            </Tab>
            <Tab 
              $active={mode === 'style'} 
              onClick={() => setMode('style')}
            >
              <BrushIcon />
              Style
            </Tab>
            <Tab 
              $active={mode === 'code'} 
              onClick={() => setMode('code')}
            >
              <CodeIcon />
              Code
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
        <PreviewPanel>
          <ErrorBoundary>
            <PreviewContent>
              <Preview 
                spec={spec} 
                renderKey={chartRenderKey} 
              />
            </PreviewContent>
          </ErrorBoundary>
        </PreviewPanel>
      </Container>
    </div>
  )
}
