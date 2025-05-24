import styled from 'styled-components';

export const ChartContainer = styled.div`
  background: var(--color-surface);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
`;

export const ChartControls = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 8px;
  background: var(--color-background);
  border-radius: 6px;
  
  button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: var(--color-surface);
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
`;

export const ChartWrapper = styled.div`
  width: 100%;
  height: 400px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
`; 