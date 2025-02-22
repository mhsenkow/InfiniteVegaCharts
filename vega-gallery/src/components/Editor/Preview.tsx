import { useEffect, useRef, useState, useCallback } from 'react'
import styled from 'styled-components'
import { renderVegaLite } from '../../utils/chartRenderer'
import { ChartFooter } from './ChartFooter'
import { MarkType } from '../../types/vega'

const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`

const ChartContainer = styled.div<{ $height: number }>`
  height: ${props => props.$height}px;
  min-height: 200px;
  position: relative;
  padding-bottom: 6px;
  
  /* Make the Vega chart responsive */
  .vega-embed {
    width: 100%;
    height: 100%;
    
    .marks {
      width: 100% !important;
      height: 100% !important;
    }
  }
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

  &:hover::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 100%;
    background: rgba(0, 0, 0, 0.05);
  }
`

interface PreviewProps {
  spec: string | TopLevelSpec;
}

export const Preview = ({ spec }: PreviewProps) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any[]>([])
  const [chartHeight, setChartHeight] = useState(400)
  const [isDragging, setIsDragging] = useState(false)
  const [markType, setMarkType] = useState<MarkType>('point')
  const [encodings, setEncodings] = useState<Record<string, any>>({})
  
  // Keep drag state in ref
  const dragState = useRef({
    startY: 0,
    startHeight: 0
  })

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragState.current = {
      startY: e.clientY,
      startHeight: chartHeight
    }
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const deltaY = e.clientY - dragState.current.startY
    const newHeight = Math.max(200, Math.min(
      window.innerHeight - 300,
      dragState.current.startHeight + deltaY
    ))
    
    setChartHeight(newHeight)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  // Use isDragging state in effect dependencies
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Define renderChart first
  const renderChart = async () => {
    try {
      const parsedSpec = typeof spec === 'string' ? JSON.parse(spec) : spec;
      
      // Create a complete valid spec with defaults
      const validSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 'container',
        height: 300,
        mark: parsedSpec.mark || { type: 'point', filled: true },
        data: parsedSpec.data || { values: [] },
        encoding: parsedSpec.encoding || {},
        transform: parsedSpec.transform,
        config: {
          ...parsedSpec.config,
          mark: {
            filled: true,
            ...parsedSpec.config?.mark
          },
          view: {
            continuousWidth: true,
            continuousHeight: true,
            ...parsedSpec.config?.view
          }
        }
      };

      setData(validSpec.data?.values || []);
      
      if (chartRef.current) {
        await renderVegaLite(chartRef.current, validSpec);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render chart');
    }
  };

  // Render chart when spec changes
  useEffect(() => {
    renderChart()
  }, [spec])

  // Render chart when height changes
  useEffect(() => {
    renderChart()
  }, [chartHeight])

  // Add effect to get mark type from spec
  useEffect(() => {
    try {
      const parsedSpec = typeof spec === 'string' ? JSON.parse(spec) : spec;
      const mark = parsedSpec.mark
      setMarkType(typeof mark === 'string' ? mark : mark.type)
      setEncodings(parsedSpec.encoding || {})
    } catch (err) {
      console.error('Failed to parse spec:', err)
    }
  }, [spec])

  // Add handler for encoding changes
  const handleEncodingChange = (channel: string, field: string) => {
    const newEncodings = {
      ...encodings,
      [channel]: field ? { field, type: 'quantitative' } : undefined
    }
    setEncodings(newEncodings)
    
    // Update spec with new encodings
    try {
      const parsedSpec = typeof spec === 'string' ? JSON.parse(spec) : spec;
      const updatedSpec = {
        ...parsedSpec,
        encoding: newEncodings
      }
      // Call parent update function or handle spec update
    } catch (err) {
      console.error('Failed to update encodings:', err)
    }
  }

  return (
    <PreviewContainer>
      <ChartContainer ref={chartRef} $height={chartHeight}>
        <div style={{ width: '100%', height: '100%' }} />
      </ChartContainer>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <ResizeHandle 
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          e.preventDefault()
          const touch = e.touches[0]
          handleMouseDown({ clientY: touch.clientY } as any)
        }}
      />
      <DataContainer>
        <ChartFooter 
          data={data}
          markType={markType}
          currentEncodings={encodings}
          onEncodingChange={handleEncodingChange}
        />
      </DataContainer>
    </PreviewContainer>
  )
}
