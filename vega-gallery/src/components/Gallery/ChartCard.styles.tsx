import styled from 'styled-components';

export const Card = styled.button`
  background: var(--color-surface);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

export const ChartPreview = styled.div`
  aspect-ratio: 4/3;
  min-height: 240px;
  padding: 16px;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  
  .vega-embed {
    width: 100%;
    height: 100%;
    
    .marks {
      width: 100% !important;
      height: 100% !important;
    }
  }
`;

export const Content = styled.div`
  padding: 16px;
`;

export const Title = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: var(--color-text-primary);
  font-weight: 600;
`;

export const Description = styled.p`
  margin: 0 0 16px 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
`;

export const BadgeContainer = styled.div`
  display: flex;
  gap: 8px;
`;

export const Badge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
`; 