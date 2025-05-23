import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useDashboardStore } from '../../store/dashboardStore';
import { renderVegaLite } from '../../utils/chartRenderer';
import { ChartSelector } from './ChartSelector';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
  flex-grow: 1;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background-color: #f8f9fa;
  border: 2px dashed #ced4da;
  border-radius: 8px;
  color: #6c757d;
  text-align: center;
  padding: 32px;
`;

const ChartCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 300px;
  position: relative;
`;

const ChartHeader = styled.div`
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChartTitle = styled.div`
  font-weight: 500;
  font-size: 0.95rem;
  color: ${props => props.theme.text.primary};
`;

const ChartContent = styled.div`
  flex-grow: 1;
  position: relative;
  min-height: 250px;
  
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
  color: #6c757d;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background-color: #f1f3f5;
    color: #dc3545;
  }
`;

const AddChartButton = styled.button`
  width: 100%;
  height: 100%;
  min-height: 300px;
  background-color: #f8f9fa;
  border: 2px dashed #ced4da;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
    color: ${props => props.theme.text.primary};
  }
  
  svg {
    font-size: 2rem;
    margin-bottom: 8px;
  }
`;

const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GridView: React.FC = () => {
  const { 
    currentDashboard, 
    removeChart,
    snapshots,
    addChart
  } = useDashboardStore();
  
  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [showChartSelector, setShowChartSelector] = React.useState(false);
  
  // Render charts when dashboard changes
  useEffect(() => {
    if (!currentDashboard) return;
    
    currentDashboard.charts.forEach(chart => {
      const chartElement = chartRefs.current[chart.id];
      if (chartElement && chart.snapshot?.spec) {
        try {
          renderVegaLite(chartElement, chart.snapshot.spec);
        } catch (error) {
          console.error('Failed to render chart:', error);
        }
      }
    });
  }, [currentDashboard]);
  
  const handleAddChart = () => {
    setShowChartSelector(true);
  };
  
  const handleChartSelect = (snapshot: any) => {
    addChart(snapshot);
    setShowChartSelector(false);
  };
  
  const handleRemoveChart = (chartId: string) => {
    if (window.confirm('Are you sure you want to remove this chart?')) {
      removeChart(chartId);
    }
  };
  
  if (!currentDashboard) {
    return (
      <EmptyState>
        <p>No dashboard selected. Create a new one or select an existing one.</p>
      </EmptyState>
    );
  }
  
  if (currentDashboard.charts.length === 0) {
    return (
      <>
        <AddChartButton onClick={handleAddChart}>
          <PlusIcon />
          <div>Add Chart</div>
        </AddChartButton>
        
        {showChartSelector && (
          <ChartSelector 
            snapshots={snapshots}
            onSelect={handleChartSelect}
            onClose={() => setShowChartSelector(false)}
          />
        )}
      </>
    );
  }
  
  return (
    <>
      <GridContainer>
        {currentDashboard.charts.map(chart => (
          <ChartCard key={chart.id}>
            <ChartHeader>
              <ChartTitle>{chart.snapshot?.name || 'Untitled Chart'}</ChartTitle>
              <ActionButton onClick={() => handleRemoveChart(chart.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </ActionButton>
            </ChartHeader>
            <ChartContent 
              ref={(el) => {
                chartRefs.current[chart.id] = el;
              }} 
            />
          </ChartCard>
        ))}
        
        <AddChartButton onClick={handleAddChart}>
          <PlusIcon />
          <div>Add Chart</div>
        </AddChartButton>
      </GridContainer>
      
      {showChartSelector && (
        <ChartSelector 
          snapshots={snapshots}
          onSelect={handleChartSelect}
          onClose={() => setShowChartSelector(false)}
        />
      )}
    </>
  );
}; 