import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { renderVegaLite } from '../../utils/chartRenderer'
import { ChartFooter } from './ChartFooter'
import { TopLevelSpec } from 'vega-lite'
import DownloadIcon from '@mui/icons-material/Download'
import { ExtendedSpec, MarkType } from '../../types/vega'
import WidthNormalIcon from '@mui/icons-material/CropLandscape'
import WidthMediumIcon from '@mui/icons-material/Crop169'
import WidthWideIcon from '@mui/icons-material/Crop75'
import { Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material'
import { enhanceChartSpec } from '../../utils/chartEnhancements'
import InfoIcon from '@mui/icons-material/Info'

const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 0 10px;
`

const ChartContainer = styled.div<{ $height: number; $isActive?: boolean; $width: string }>`
  height: ${props => props.$height}px;
  min-height: 200px;
  position: relative;
  padding-bottom: 6px;
  padding: 0 20px 6px;
  margin: 0 auto;
  width: ${props => {
    switch(props.$width) {
      case 'narrow': return '800px';
      case 'medium': return '1200px';
      case 'wide': return '95%';
      default: return '85%';
    }
  }};
  cursor: ${props => props.$isActive ? 'default' : 'pointer'};
  display: flex;
  justify-content: center;
  align-items: center;
  
  /* Make the Vega chart responsive */
  .vega-embed {
    width: 100% !important;
    height: 100% !important;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 12px;
  }

  .vega-embed .marks {
    max-width: 100%;
  }
  
  /* Fix for SVG being cut off */
  svg {
    overflow: visible;
    max-width: 95%;
    margin: 0 auto;
  }
  
  ${props => !props.$isActive && `
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${props => props.theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)'};
      pointer-events: none;
    }
  `}
`

const DataContainer = styled.div`
  flex: 1;
  min-height: 150px;
  border-top: 1px solid var(--color-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-top: 6px;
`

const ErrorMessage = styled.div`
  color: var(--color-error);
  padding: 16px;
  background: ${props => props.theme.mode === 'dark' ? '#372c2c' : '#fff5f5'};
  border-radius: 4px;
  margin-top: 16px;
`

const ResizeHandle = styled.div`
  width: 100%;
  height: 12px;
  margin: -6px 0;
  background: transparent;
  cursor: ns-resize;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  position: relative;
  z-index: 10;

  &::after {
    content: '';
    width: 60px;
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    opacity: 0;
    transition: all 0.2s ease;
  }

  &:hover::after {
    opacity: 1;
    transform: scaleY(1.5);
  }

  &:active::after {
    opacity: 1;
    background: var(--color-primary);
    transform: scaleY(1.5);
  }
`

const SamplingIndicator = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--sampling-indicator-bg);
  border: 1px solid var(--sampling-indicator-border);
  border-radius: 4px;
  font-size: 12px;
  color: var(--sampling-indicator-text);
  z-index: 100;
  
  svg {
    font-size: 16px;
    color: var(--sampling-indicator-icon);
  }
`

interface AspectRatio {
  name: string;
  width: number;
  height: number;
  description: string;
}

const ASPECT_RATIOS: AspectRatio[] = [
  { name: 'Free', width: 0, height: 0, description: 'Freely resizable' },
  { name: 'Square', width: 1, height: 1, description: 'Instagram, Facebook' },
  { name: '16:9', width: 16, height: 9, description: 'YouTube, Twitter' },
  { name: '4:5', width: 4, height: 5, description: 'Instagram Feed' },
  { name: '9:16', width: 9, height: 16, description: 'Instagram Stories, TikTok' },
  { name: '1.91:1', width: 1910, height: 1000, description: 'Facebook Feed' },
  { name: '3:2', width: 3, height: 2, description: 'LinkedIn' },
  { name: '2.35:1', width: 2350, height: 1000, description: 'Twitter Card' },
];

const AspectRatioControl = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: var(--color-background);
  border-radius: 4px;
  overflow-x: auto;
`;

const RatioContainer = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
`;

const WidthToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-right: 32px;
`;

const IconOnlyButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 6px;
  height: 32px;
  width: 32px;
  margin: 0 4px;

  &:hover {
    background: var(--color-background);
    border-color: var(--color-primary);
  }

  svg {
    font-size: 18px;
  }
`;

const RatioButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${props => props.$active ? 'var(--color-primary)' : 'var(--color-border)'};
  border-radius: 4px;
  background: ${props => props.$active ? `rgba(var(--color-primary-rgb), 0.1)` : 'var(--color-surface)'};
  color: ${props => props.$active ? 'var(--color-primary)' : 'var(--color-text-primary)'};
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.9rem;

  &:hover {
    border-color: var(--color-primary);
  }

  .description {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    margin-top: 2px;
  }
`;

const DownloadMenu = styled.div`
  position: relative;
  display: inline-block;
`;

const DownloadOptions = styled.div<{ $show: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 2px 8px ${props => props.theme.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'};
  display: ${props => props.$show ? 'block' : 'none'};
  z-index: 10;
  min-width: 150px;
`;

const DownloadOption = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: var(--color-background);
  }
`;

// Helper function to determine chart type from spec
const getChartType = (spec: any): MarkType => {
  if (!spec || !spec.mark) return 'bar';
  return typeof spec.mark === 'string' ? spec.mark : spec.mark.type;
};

interface PreviewProps {
  spec: string | TopLevelSpec | ExtendedSpec;
  renderKey?: number;
  onVegaViewUpdate?: (view: any) => void;
}

// Define InlineData interface
interface InlineData {
  values: any[];
  [key: string]: any;
}

export const Preview = ({ spec, renderKey = 0, onVegaViewUpdate }: PreviewProps) => {
  const [chartHeight, setChartHeight] = useState(400)
  const [chartWidth, setChartWidth] = useState<string>('medium')
  const [isResizing, setIsResizing] = useState(false)
  const isResizingRef = useRef(false)
  const [initialY, setInitialY] = useState(0)
  const [initialHeight, setInitialHeight] = useState(0)
  const chartRef = useRef<HTMLDivElement>(null)
  const chartContentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentViewRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [chartActive, setChartActive] = useState(false)
  const [vegaViewReady, setVegaViewReady] = useState(false)
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(ASPECT_RATIOS[0])
  const [parsedSpec, setParsedSpec] = useState<any>(null)
  const [isDataSampled, setIsDataSampled] = useState(false)
  const [originalDataLength, setOriginalDataLength] = useState<number | null>(null)
  const [sampledDataLength, setSampledDataLength] = useState<number | null>(null)
  const [sampleSize, setSampleSize] = useState(1000);

  // Parse the input spec
  useEffect(() => {
    try {
      const specObj = typeof spec === 'string' ? JSON.parse(spec) : spec;
      setParsedSpec(specObj);
      
      // Check if data exists and store original length
      if (specObj?.data?.values) {
        setOriginalDataLength(specObj.data.values.length);
      } else {
        setOriginalDataLength(null);
      }
    } catch (e) {
      console.error('Error parsing spec:', e);
      setError(e instanceof Error ? e.message : 'Failed to parse spec');
    }
  }, [spec]);

  // Function to render the chart
  const renderChart = useCallback(async () => {
    if (!chartContentRef.current || !parsedSpec) {
      return;
    }

    if (currentViewRef.current) {
      try {
        console.log('Finalizing existing view before re-render');
        currentViewRef.current.finalize();
        currentViewRef.current = null;
      } catch (e) {
        console.error('Error finalizing existing view:', e);
      }
    }
     
    try {
      // Clear previous content safely
      chartContentRef.current.innerHTML = '';
      
      // Apply data sampling for large datasets
      const chartType = getChartType(parsedSpec);
      const originalData = parsedSpec.data?.values;
      let renderSpec;
      
      // Check if the dataset is large and apply sampling
      if (originalData && originalData.length > 1000) {
        console.log(`Applying sampling to large dataset (${originalData.length} points) for ${chartType} chart`);
        
        // Apply enhancements including sampling
        renderSpec = enhanceChartSpec({
          ...parsedSpec,
          width: 'container',
          height: 'container',
          autosize: {
            type: 'fit',
            contains: 'padding'
          },
          config: {
            ...(parsedSpec.config || {}),
            _forceNewView: renderKey, // This will cause Vega to create a new View
            sampleSize: sampleSize // Add sampleSize to config
          }
        }, chartType, sampleSize);
        
        // Check if sampling was applied with proper type casting
        const inlineData = renderSpec.data as InlineData;
        const sampledData = inlineData?.values;
        const wasSampled = sampledData && originalData && sampledData.length < originalData.length;
        setIsDataSampled(wasSampled);
        
        if (wasSampled && sampledData) {
          setSampledDataLength(sampledData.length);
          console.log(`Dataset sampled from ${originalData.length} to ${sampledData.length} points`);
        } else {
          setSampledDataLength(null);
        }
      } else {
        // For smaller datasets, no sampling needed
        renderSpec = {
          ...parsedSpec,
          width: 'container',
          height: 'container',
          autosize: {
            type: 'fit',
            contains: 'padding'
          },
          config: {
            ...(parsedSpec.config || {}),
            _forceNewView: renderKey,
            sampleSize: sampleSize // Add sampleSize to config
          }
        };
        setIsDataSampled(false);
        setSampledDataLength(null);
      }
      
      console.log('Rendering chart with spec:', renderSpec);
      
      // Render the chart and get the view
      const view = await renderVegaLite(chartContentRef.current, renderSpec);
      
      // Store the view reference
      currentViewRef.current = view;
      
      // If view is available, update state and callback
      if (view) {
        console.log('Vega view successfully created');
        setVegaViewReady(true);
        setChartActive(true);
        
        // If callback is provided, pass the view
        if (onVegaViewUpdate) {
          console.log('Updating Vega view reference in parent component');
          onVegaViewUpdate(view);
        }
      } else {
        console.warn('renderVegaLite returned no view');
        setVegaViewReady(false);
        
        // Reset the view reference in parent if no view is available
        if (onVegaViewUpdate) {
          onVegaViewUpdate(null);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error rendering chart:', err);
      setError(err instanceof Error ? err.message : 'Failed to render chart');
      setVegaViewReady(false);
      
      // Reset the view if there's an error
      currentViewRef.current = null;
      if (onVegaViewUpdate) {
        onVegaViewUpdate(null);
      }
    }
  }, [parsedSpec, renderKey, onVegaViewUpdate, sampleSize]);

  // Ensure chart is rendered when component mounts or spec changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('Initial chart render');
      renderChart().then(() => {
        // Automatically activate the chart when it's rendered
        if (currentViewRef.current) {
          setChartActive(true);
          setVegaViewReady(true);
          if (onVegaViewUpdate) {
            console.log('Auto-activating chart and updating parent view reference');
            onVegaViewUpdate(currentViewRef.current);
          }
        }
      });
    }, 200); // Slightly longer timeout to ensure DOM is ready
    return () => clearTimeout(timeoutId);
  }, [renderChart, onVegaViewUpdate]);

  // Add a separate effect to ensure chart is re-rendered when renderKey changes
  useEffect(() => {
    if (renderKey > 0) {
      console.log('Rendering chart with key:', renderKey);
      const timeoutId = setTimeout(() => {
        renderChart().then(() => {
          // Auto-activate on re-render as well
          if (currentViewRef.current) {
            setChartActive(true);
            setVegaViewReady(true);
            if (onVegaViewUpdate) {
              console.log('View updated after renderKey change');
              onVegaViewUpdate(currentViewRef.current);
            }
          }
        });
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [renderKey, renderChart, onVegaViewUpdate]);

  // Handle resize
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        renderChart();
      });
    });

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, [renderChart]);

  const updateHeightForRatio = useCallback(() => {
    if (selectedRatio.width === 0 || !containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const newHeight = (containerWidth * selectedRatio.height) / selectedRatio.width;
    setChartHeight(Math.min(1200, Math.max(200, newHeight)));
  }, [selectedRatio]);

  useEffect(() => {
    if (selectedRatio.width > 0) {
      updateHeightForRatio();
    }
  }, [selectedRatio, updateHeightForRatio]);

  useEffect(() => {
    if (selectedRatio.width === 0) return;

    const handleResize = () => {
      updateHeightForRatio();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedRatio, updateHeightForRatio]);

  const handleDownloadSVG = useCallback(() => {
    if (!chartRef.current) return;

    // Find the SVG element
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) return;

    // Clone the SVG to avoid modifying the displayed one
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    // Add any missing namespaces
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // Create a blob from the SVG
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chart.svg';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadPNG = useCallback(async () => {
    if (!chartRef.current) return;

    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) return;

    // Create a canvas with the same dimensions
    const canvas = document.createElement('canvas');
    const bbox = svgElement.getBoundingClientRect();
    canvas.width = bbox.width;
    canvas.height = bbox.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Create image and draw to canvas
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      
      // Download PNG
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = 'chart.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const handleDownloadJSON = useCallback(() => {
    if (!parsedSpec) return;
    
    // Convert the spec to a string
    const jsonString = JSON.stringify(parsedSpec, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chart-spec.json';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [parsedSpec]);

  const handleChartClick = useCallback(() => {
    console.log('Chart clicked, force activating...');
    
    // Force re-render of the chart to ensure view is available
    renderChart().then(() => {
      // If view is now available, make sure to update parent
      if (currentViewRef.current && onVegaViewUpdate) {
        console.log('View available after click, updating parent');
        setChartActive(true);
        setVegaViewReady(true);
        onVegaViewUpdate(currentViewRef.current);
      } else {
        console.warn('Failed to create view after click');
      }
    });
  }, [renderChart, onVegaViewUpdate]);

  const handleChartWidthChange = (event: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue) {
      setChartWidth(newValue);
      localStorage.setItem('chartWidth', newValue);
      // Trigger a resize to update the chart
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    isResizingRef.current = true;
    setInitialY(e.clientY);
    setInitialHeight(chartHeight);
    document.body.style.cursor = 'ns-resize';
    
    // Define the handlers outside the mousedown event to ensure proper cleanup
    function handleMouseMove(e: MouseEvent) {
      if (!isResizingRef.current) return;
      const delta = e.clientY - initialY;
      const newHeight = Math.max(200, Math.min(1200, initialHeight + delta));
      setChartHeight(newHeight);
      
      // Force chart to redraw when resizing is happening
      if (chartRef.current) {
        chartRef.current.style.height = `${newHeight}px`;
      }
    }
    
    function handleMouseUp() {
      setIsResizing(false);
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Force chart to redraw after resize is complete
      window.dispatchEvent(new Event('resize'));
      
      // Force vega chart to redraw specifically
      renderChart();
    }
    
    // Add event listeners to document to catch events outside the component
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent default behavior to avoid text selection during resize
    e.preventDefault();
  };

  return (
    <PreviewContainer ref={containerRef}>
      <AspectRatioControl>
        <RatioContainer>
          {ASPECT_RATIOS.map((ratio) => (
            <Tooltip key={ratio.name} title={ratio.description} arrow>
              <RatioButton
                $active={selectedRatio.name === ratio.name}
                onClick={() => setSelectedRatio(ratio)}
              >
                {ratio.name}
              </RatioButton>
            </Tooltip>
          ))}
        </RatioContainer>
        
        <WidthToggleContainer>
          <span>Width:</span>
          <ToggleButtonGroup
            value={chartWidth}
            exclusive
            onChange={handleChartWidthChange}
            aria-label="chart width"
            size="small"
          >
            <ToggleButton value="narrow" aria-label="narrow width">
              <WidthNormalIcon />
            </ToggleButton>
            <ToggleButton value="medium" aria-label="medium width">
              <WidthMediumIcon />
            </ToggleButton>
            <ToggleButton value="wide" aria-label="wide width">
              <WidthWideIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </WidthToggleContainer>
        
        <IconOnlyButton
          onClick={() => setShowDownloadMenu(!showDownloadMenu)}
          aria-label="Download chart"
        >
          <DownloadIcon />
        </IconOnlyButton>
        
        <DownloadMenu>
          <DownloadOptions $show={showDownloadMenu}>
            <DownloadOption onClick={handleDownloadSVG}>SVG Image</DownloadOption>
            <DownloadOption onClick={handleDownloadPNG}>PNG Image</DownloadOption>
            <DownloadOption onClick={handleDownloadJSON}>JSON Spec</DownloadOption>
          </DownloadOptions>
        </DownloadMenu>
      </AspectRatioControl>

      <ChartContainer
        ref={chartRef}
        $height={chartHeight}
        $isActive={chartActive}
        $width={chartWidth}
        onClick={() => !chartActive && setChartActive(true)}
      >
        {isDataSampled && (
          <SamplingIndicator title={`Showing a sample of ${sampledDataLength} out of ${originalDataLength} data points for better performance`}>
            <InfoIcon fontSize="small" />
            Showing sampled data for performance
          </SamplingIndicator>
        )}
        
        <div ref={chartContentRef} style={{ width: '100%', height: '100%' }} />
      </ChartContainer>

      <ResizeHandle
        onMouseDown={handleMouseDown}
        title="Drag to resize chart"
      />

      <DataContainer>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <ChartFooter
          data={parsedSpec?.data?.values}
          spec={parsedSpec}
          sampleSize={sampleSize}
          onSampleSizeChange={(newSize) => {
            console.log(`Preview: Changing sample size from ${sampleSize} to ${newSize}`);
            setSampleSize(newSize);
            
            // Ensure we're not in resize mode when changing sample size
            if (isResizingRef.current) {
              isResizingRef.current = false;
              setIsResizing(false);
              document.body.style.cursor = '';
            }
            
            // Use setTimeout to ensure state is updated before re-rendering
            setTimeout(() => {
              // Force re-render with the new sample size
              renderChart();
            }, 0);
          }}
        />
      </DataContainer>
    </PreviewContainer>
  )
}
