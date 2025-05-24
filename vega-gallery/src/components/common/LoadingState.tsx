import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
`;

const Spinner = styled.div<{ $size?: 'small' | 'medium' | 'large' }>`
  width: ${props => props.$size === 'small' ? '20px' : props.$size === 'large' ? '60px' : '40px'};
  height: ${props => props.$size === 'small' ? '20px' : props.$size === 'large' ? '60px' : '40px'};
  border: ${props => props.$size === 'small' ? '2px' : '3px'} solid var(--color-primary);
  border-radius: 50%;
  border-top-color: transparent;
  animation: ${pulse} 1s linear infinite;
`;

export const LoadingState = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => (
  <Container>
    <Spinner $size={size} />
  </Container>
); 