import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { renderVegaLite } from '../../utils/chartRenderer'
import { ChartFooter } from './ChartFooter'
import { TopLevelSpec } from 'vega-lite'
import DownloadIcon from '@mui/icons-material/Download'
import { ExtendedSpec } from '../../types/vega'
import WidthNormalIcon from '@mui/icons-material/CropLandscape'
import WidthMediumIcon from '@mui/icons-material/Crop169'
import WidthWideIcon from '@mui/icons-material/Crop75'
import { Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material'

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
      background: rgba(0, 0, 0, 0.02);
      pointer-events: none;
    }
  `}
`

const DataContainer = styled.div`
  flex: 1;
  min-height: 150px;
  border-top: 1px solid #eee;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-top: 6px;
`

const ErrorMessage = styled.div`
  color: #dc3545;
  padding: 16px;
  background: #fff5f5;
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
    background: ${props => props.theme.colors.border};
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
    background: ${props => props.theme.colors.primary};
    transform: scaleY(1.5);
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
  background: #f8f9fa;
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
  background: white;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  color: ${props => props.theme.text.primary};
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 6px;
  height: 32px;
  width: 32px;
  margin: 0 4px;

  &:hover {
    background: #f8f9fa;
    border-color: ${props => props.theme.colors.primary};
  }

  svg {
    font-size: 18px;
  }
`;

const RatioButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: 4px;
  background: ${props => props.$active ? `${props.theme.colors.primary}10` : 'white'};
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.text.primary};
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.9rem;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }

  .description {
    font-size: 0.8rem;
    color: ${props => props.theme.text.secondary};
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
  background: white;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
    background: #f8f9fa;
  }
`;

interface PreviewProps {
  spec: string | TopLevelSpec | ExtendedSpec;
  renderKey?: number;
  onVegaViewUpdate?: (view: any) => void;
}

export const Preview = ({ spec, renderKey = 0, onVegaViewUpdate }: PreviewProps) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartContentRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [sampleSize, setSampleSize] = useState(10)
  const [chartHeight, setChartHeight] = useState(400)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startY: 0, startHeight: 0 })
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(ASPECT_RATIOS[0])
  const containerRef = useRef<HTMLDivElement>(null)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [chartActive, setChartActive] = useState(false)
  const [vegaViewReady, setVegaViewReady] = useState(false)
  const currentViewRef = useRef<any>(null)
  const [chartWidth, setChartWidth] = useState(() => {
    return localStorage.getItem('chartWidth') || 'medium';
  });

  // Fix the type issues in parsedSpec creation
  const parsedSpec = useMemo(() => {
    if (typeof spec === 'string') {
      try {
        return JSON.parse(spec);
      } catch (e) {
        console.error('Failed to parse spec:', e);
        return { data: { values: [] } };
      }
    }
    return spec;
  }, [spec]);

  // Clean up Vega view when component unmounts
  useEffect(() => {
    return () => {
      // Clean up the view when component unmounts
      if (currentViewRef.current) {
        console.log('Cleaning up Vega view');
        try {
          currentViewRef.current.finalize();
        } catch (e) {
          console.error('Error finalizing Vega view:', e);
        }
        currentViewRef.current = null;
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragRef.current = {
      startY: e.clientY,
      startHeight: chartHeight
    }
    document.body.style.cursor = 'ns-resize'
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const delta = e.clientY - dragRef.current.startY
      const newHeight = Math.max(200, Math.min(800, dragRef.current.startHeight + delta))
      setChartHeight(newHeight)
      
      // Trigger immediate chart resize
      requestAnimationFrame(() => {
        renderChart()
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ''
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const renderChart = useCallback(async () => {
    if (!chartRef.current || !chartContentRef.current) return;
    
    // If there's an existing view, clean it up first
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
      
      // Create a safely typed spec for rendering
      const renderSpec = {
        ...parsedSpec,
        width: 'container',
        height: 'container',
        autosize: {
          type: 'fit',
          contains: 'padding'
        },
        // Add the renderKey as a config property to force new Vega-Lite view creation
        config: {
          ...(parsedSpec.config || {}),
          _forceNewView: renderKey // This will cause Vega to create a new View
        }
      };
      
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
  }, [parsedSpec, renderKey, onVegaViewUpdate]);

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

  return (
    <PreviewContainer ref={containerRef}>
      <AspectRatioControl>
        <RatioContainer>
          {ASPECT_RATIOS.map(ratio => (
            <RatioButton
              key={ratio.name}
              $active={selectedRatio.name === ratio.name}
              onClick={() => setSelectedRatio(ratio)}
            >
              {ratio.name}
              <div className="description">{ratio.description}</div>
            </RatioButton>
          ))}
        </RatioContainer>
        
        <WidthToggleContainer>
          <Tooltip title="Chart Width">
            <ToggleButtonGroup
              value={chartWidth}
              exclusive
              onChange={handleChartWidthChange}
              size="small"
            >
              <ToggleButton value="narrow" aria-label="narrow">
                <WidthNormalIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="medium" aria-label="medium">
                <WidthMediumIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="wide" aria-label="wide">
                <WidthWideIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Tooltip>
          
          <DownloadMenu>
            <Tooltip title="Download Chart">
              <IconOnlyButton onClick={() => setShowDownloadMenu(!showDownloadMenu)}>
                <DownloadIcon />
              </IconOnlyButton>
            </Tooltip>
            <DownloadOptions $show={showDownloadMenu}>
              <DownloadOption onClick={() => {
                handleDownloadSVG();
                setShowDownloadMenu(false);
              }}>
                <DownloadIcon /> SVG Vector
              </DownloadOption>
              <DownloadOption onClick={() => {
                handleDownloadPNG();
                setShowDownloadMenu(false);
              }}>
                <DownloadIcon /> PNG Image
              </DownloadOption>
            </DownloadOptions>
          </DownloadMenu>
        </WidthToggleContainer>
      </AspectRatioControl>

      <div>
        <ChartContainer
          ref={chartRef}
          $height={chartHeight}
          $isActive={chartActive && vegaViewReady}
          $width={chartWidth}
          onClick={handleChartClick}
        >
          <div ref={chartContentRef} style={{ width: '100%', height: '100%' }} />
        </ChartContainer>
      </div>
      
      <ResizeHandle 
        className="resize-handle" 
        title="Resize chart" 
        onMouseDown={handleMouseDown}
      />
      
      <DataContainer>
        {error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : (
          <ChartFooter
            data={parsedSpec?.data?.values}
            spec={parsedSpec}
            sampleSize={sampleSize}
            onSampleSizeChange={setSampleSize}
          />
        )}
      </DataContainer>
    </PreviewContainer>
  );
};
