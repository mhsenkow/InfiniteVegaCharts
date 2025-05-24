import { useState } from 'react';
import styled from 'styled-components';
import { resetDatabase } from '../../utils/indexedDB';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: var(--color-surface);
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  margin-bottom: 16px;
`;

const Title = styled.h2`
  margin: 0;
  color: #d32f2f;
`;

const Message = styled.p`
  margin: 16px 0;
  line-height: 1.5;
`;

const ErrorDetails = styled.pre`
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow: auto;
  max-height: 100px;
  margin-bottom: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  background-color: ${props => props.$primary ? '#1976d2' : '#e0e0e0'};
  color: ${props => props.$primary ? 'white' : 'rgba(0, 0, 0, 0.87)'};
  
  &:hover {
    background-color: ${props => props.$primary ? '#1565c0' : '#d5d5d5'};
  }
  
  &:disabled {
    background-color: #e0e0e0;
    color: rgba(0, 0, 0, 0.38);
    cursor: not-allowed;
  }
`;

interface DatabaseErrorModalProps {
  isOpen: boolean;
  error: Error | null;
  onClose: () => void;
  onReset?: () => void;
}

export const DatabaseErrorModal = ({ 
  isOpen, 
  error, 
  onClose,
  onReset 
}: DatabaseErrorModalProps) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen) return null;

  const handleReset = async () => {
    try {
      setIsResetting(true);
      setResetError(null);
      
      await resetDatabase();
      
      setResetSuccess(true);
      if (onReset) {
        onReset();
      }
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <Title>Database Error</Title>
        </ModalHeader>
        
        <Message>
          {resetSuccess ? (
            'Database has been successfully reset. You can now try again.'
          ) : (
            <>
              There was a problem accessing the database. This could be due to:
              <ul>
                <li>Browser privacy mode or storage restrictions</li>
                <li>Storage quota exceeded</li>
                <li>Database corruption</li>
              </ul>
              You can try resetting the database to fix the issue.
            </>
          )}
        </Message>
        
        {error && !resetSuccess && (
          <ErrorDetails>
            {error.name}: {error.message}
          </ErrorDetails>
        )}
        
        {resetError && (
          <ErrorDetails>
            Reset failed: {resetError}
          </ErrorDetails>
        )}
        
        <ButtonGroup>
          <Button onClick={onClose}>
            {resetSuccess ? 'Close' : 'Cancel'}
          </Button>
          
          {!resetSuccess && (
            <Button 
              $primary 
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? 'Resetting...' : 'Reset Database'}
            </Button>
          )}
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
}; 