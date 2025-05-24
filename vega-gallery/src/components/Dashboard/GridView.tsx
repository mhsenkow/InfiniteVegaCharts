import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useDashboardStore } from '../../store/dashboardStore';
import { ChartSelector } from './ChartSelector';
import { DashboardChart } from './DashboardChart';

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
  background-color: var(--color-background);
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 32px;
`;

const AddChartButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background-color: var(--color-background);
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: var(--color-border);
    border-color: var(--color-text-tertiary);
  }
`;

const PlusIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 8px;
  
  &::before {
    content: '+';
  }
`;

export const GridView: React.FC = () => {
  const { 
    currentDashboard, 
    removeChart,
    snapshots,
    addChart
  } = useDashboardStore();
  
  const [showChartSelector, setShowChartSelector] = React.useState(false);
  
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
          <DashboardChart 
            key={chart.id} 
            chart={chart} 
            onRemove={handleRemoveChart} 
          />
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