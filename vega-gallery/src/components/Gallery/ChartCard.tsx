import { useEffect, useRef, memo, useCallback } from 'react'
import { ChartConfig } from '../../types/chart'
import { renderVegaLite } from '../../utils/chartRenderer'
import { chartSpecs } from '../../charts'
import {
  Card,
  ChartPreview,
  Content,
  Title,
  Description,
  BadgeContainer,
  Badge
} from './ChartCard.styles'

interface ChartCardProps {
  chart: ChartConfig;
  onClick: (id: string) => void;
}

const CardContent = memo(
  ({ title, description, category, complexity }: {
    title: string;
    description: string;
    category: string;
    complexity: string;
  }) => (
    <Content>
      <Title>{title}</Title>
      <Description>{description}</Description>
      <BadgeContainer>
        <Badge>{category}</Badge>
        <Badge>{complexity}</Badge>
      </BadgeContainer>
    </Content>
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.title === nextProps.title &&
      prevProps.description === nextProps.description &&
      prevProps.category === nextProps.category &&
      prevProps.complexity === nextProps.complexity
    );
  }
);

CardContent.displayName = 'CardContent';

export default memo(function ChartCard({ chart, onClick }: ChartCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const renderTimeout = useRef<number>();
  const observer = useRef<ResizeObserver>();

  useEffect(() => {
    // Set up resize observer for responsive charts
    observer.current = new ResizeObserver(() => {
      if (renderTimeout.current) {
        window.clearTimeout(renderTimeout.current);
      }
      renderTimeout.current = window.setTimeout(() => {
        renderChart();
      }, 100);
    });

    if (chartRef.current) {
      observer.current.observe(chartRef.current);
    }

    return () => {
      observer.current?.disconnect();
      if (renderTimeout.current) {
        window.clearTimeout(renderTimeout.current);
      }
    };
  }, []);

  const renderChart = useCallback(async () => {
    if (!chartRef.current) return;
    
    // Use explicit type checking to satisfy TypeScript
    const chartId = chart.id as keyof typeof chartSpecs;
    const spec = chartSpecs[chartId];
    if (!spec) return;

    try {
      // Check if this is a Vega spec rather than Vega-Lite
      const isVegaSpec = !!(spec.$schema && spec.$schema.includes('vega.github.io/schema/vega'));
      
      // Apply container sizing only to Vega-Lite specs, as Vega specs have their own sizing
      const specToRender = isVegaSpec ? 
        spec : 
        {
          ...spec,
          width: 'container',
          height: 'container',
          autosize: { type: 'fit', contains: 'padding' }
        };
      
      // Use a type assertion to handle both Vega and Vega-Lite specs
      await renderVegaLite(chartRef.current, specToRender as any, { mode: 'gallery' });
    } catch (error) {
      console.error(`Failed to render chart ${chart.id}:`, error);
    }
  }, [chart.id]);

  const handleClick = useCallback(() => onClick(chart.id), [chart.id, onClick]);

  return (
    <Card 
      onClick={handleClick}
      aria-label={`${chart.title} - ${chart.description}`}
      role="button"
      tabIndex={0}
    >
      <ChartPreview ref={chartRef} />
      <CardContent 
        title={chart.title}
        description={chart.description}
        category={chart.category}
        complexity={chart.complexity}
      />
    </Card>
  );
}, (prevProps, nextProps) => {
  return prevProps.chart.id === nextProps.chart.id;
})
