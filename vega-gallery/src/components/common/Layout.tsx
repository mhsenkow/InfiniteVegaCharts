import styled from 'styled-components'
import { Header } from './Header'

const LayoutContainer = styled.div`
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  transition: background-color var(--transition-normal), 
              color var(--transition-normal);
`

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <LayoutContainer className="layout-container">
      <Header />
      {children}
    </LayoutContainer>
  )
}
