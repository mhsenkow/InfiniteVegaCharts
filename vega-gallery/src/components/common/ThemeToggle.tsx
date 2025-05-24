import { IconButton, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import styled from 'styled-components';
import { useTheme } from '../../styles/ThemeProvider';

const ToggleButton = styled(IconButton)`
  color: var(--color-text-primary);
  transition: color var(--transition-fast);
  
  &:hover {
    color: var(--color-primary);
  }
`;

export const ThemeToggle = () => {
  const { mode, toggleTheme } = useTheme();
  
  return (
    <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
      <ToggleButton onClick={toggleTheme} size="medium" aria-label="Toggle theme">
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </ToggleButton>
    </Tooltip>
  );
}; 