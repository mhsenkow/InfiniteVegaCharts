import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import ViewComfyIcon from '@mui/icons-material/ViewComfy'
import StorageIcon from '@mui/icons-material/Storage'
import DashboardIcon from '@mui/icons-material/Dashboard'
import { IconButton, Tooltip } from '@mui/material'

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.text.primary};
`

const Navigation = styled.nav`
  display: flex;
  gap: 8px;
`

export const Header = () => {
  const navigate = useNavigate()

  return (
    <HeaderContainer>
      <Logo>Vega Gallery</Logo>
      <Navigation>
        <Tooltip title="Gallery">
          <IconButton onClick={() => navigate('/')}>
            <ViewComfyIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Dashboard">
          <IconButton onClick={() => navigate('/dashboard')}>
            <DashboardIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Data Management">
          <IconButton onClick={() => navigate('/data')}>
            <StorageIcon />
          </IconButton>
        </Tooltip>
      </Navigation>
    </HeaderContainer>
  )
}
