import styled from 'styled-components';

export const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px ${props => props.theme.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'};
  margin-bottom: 20px;
  background: var(--color-surface);
  
  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    border-radius: 0;
    border: none;
    margin-bottom: 0;
  }
`;

export const ChartWrapper = styled.div`
  flex: 1;
  min-height: 300px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .vega-embed {
    width: 100%;
    height: 100%;
  }
`;

export const ChartControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-hover, #f9f9f9);
  
  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  button {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    
    &:hover {
      background: var(--color-surface-hover, #f5f5f5);
    }
  }
  
  .dropdown {
    position: relative;
    
    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      box-shadow: 0 2px 8px ${props => props.theme.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'};
      display: none;
      flex-direction: column;
      width: 120px;
      z-index: 10;
      
      button {
        border: none;
        border-radius: 0;
        text-align: left;
        padding: 8px 12px;
        
        &:hover {
          background: var(--color-surface-hover, #f5f5f5);
        }
      }
    }
    
    &:hover .dropdown-menu {
      display: flex;
    }
  }
  
  .data-info {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-secondary);
    background: var(--color-sampling-indicator-background, #f5f5f5);
    border: 1px solid var(--color-sampling-indicator-border, #ddd);
    border-radius: 4px;
    padding: 4px 8px;
    
    span[role="img"] {
      font-size: 14px;
    }
  }
`; 