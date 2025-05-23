import styled from 'styled-components'
import { Header } from './Header'

const LayoutContainer = styled.div`
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
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
