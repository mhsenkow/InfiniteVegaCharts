import styled from 'styled-components';

export const ChartWrapper = styled.div`
  width: 100%;
  height: 400px;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  
  .vega-embed {
    width: 100%;
    height: 100%;
    
    .chart-wrapper {
      width: 100% !important;
      height: 100% !important;
    }
  }
`;

export const ChartContainer = styled.div`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${props => props.theme.colors.border};
  transition: all 0.3s ease;
  
  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    border-radius: 0;
    border: none;
    display: flex;
    flex-direction: column;
    
    ${ChartWrapper} {
      flex: 1;
    }
  }
`;

export const ChartControls = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  
  .control-group {
    display: flex;
    gap: 8px;
  }
  
  button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    color: #333;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: #f0f0f0;
      border-color: #999;
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0px);
    }
  }
  
  .dropdown {
    position: relative;
    
    .dropdown-toggle {
      background: white;
    }
    
    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: white;
      border-radius: 4px;
      border: 1px solid #ddd;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      min-width: 160px;
      z-index: 10;
      display: none;
      overflow: hidden;
      
      button {
        width: 100%;
        text-align: left;
        padding: 8px 12px;
        border: none;
        border-radius: 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
      }
    }
    
    &:hover .dropdown-menu {
      display: block;
    }
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    
    .control-group {
      justify-content: center;
    }
  }
`; 