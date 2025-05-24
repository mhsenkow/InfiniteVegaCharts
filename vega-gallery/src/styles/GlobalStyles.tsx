import { createGlobalStyle } from 'styled-components';
import { Theme } from './theme';

// Utility to convert hex color to RGB format
const hexToRgb = (hex: string) => {
  // Remove the hash if it exists
  const cleanHex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(cleanHex.length === 3 ? cleanHex[0] + cleanHex[0] : cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.length === 3 ? cleanHex[1] + cleanHex[1] : cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.length === 3 ? cleanHex[2] + cleanHex[2] : cleanHex.substring(4, 6), 16);
  
  // Return the RGB values as a comma-separated string
  return `${r}, ${g}, ${b}`;
};

export const GlobalStyles = createGlobalStyle<{ theme: Theme }>`
  :root {
    /* Define CSS variables for easy access to theme values */
    --font-family-body: ${({ theme }) => theme.typography.fontFamily.body};
    --font-family-mono: ${({ theme }) => theme.typography.fontFamily.mono};
    
    /* Base colors */
    --color-primary: ${({ theme }) => theme.colors.primary};
    --color-secondary: ${({ theme }) => theme.colors.secondary};
    --color-success: ${({ theme }) => theme.colors.success};
    --color-warning: ${({ theme }) => theme.colors.warning};
    --color-error: ${({ theme }) => theme.colors.error};
    --color-error-light: ${({ theme }) => theme.colors.error + '20'};
    --color-error-dark: ${({ theme }) => theme.mode === 'dark' ? '#ff1744' : '#c82333'};
    --color-info: ${({ theme }) => theme.colors.info};
    
    /* RGB variants for opacity manipulation */
    --color-primary-rgb: ${({ theme }) => hexToRgb(theme.colors.primary)};
    --color-secondary-rgb: ${({ theme }) => hexToRgb(theme.colors.secondary)};
    --color-success-rgb: ${({ theme }) => hexToRgb(theme.colors.success)};
    --color-warning-rgb: ${({ theme }) => hexToRgb(theme.colors.warning)};
    --color-error-rgb: ${({ theme }) => hexToRgb(theme.colors.error)};
    --color-info-rgb: ${({ theme }) => hexToRgb(theme.colors.info)};
    --color-text-primary-rgb: ${({ theme }) => hexToRgb(theme.colors.text.primary)};
    --color-text-secondary-rgb: ${({ theme }) => hexToRgb(theme.colors.text.secondary)};
    
    /* Background & surface colors */
    --color-background: ${({ theme }) => theme.colors.background};
    --color-surface: ${({ theme }) => theme.colors.surface};
    --color-surface-hover: ${({ theme }) => theme.colors.surfaceHover};
    --color-surface-active: ${({ theme }) => theme.colors.surfaceActive};
    
    /* Border colors */
    --color-border: ${({ theme }) => theme.colors.border};
    
    /* Text colors */
    --color-text-primary: ${({ theme }) => theme.colors.text.primary};
    --color-text-secondary: ${({ theme }) => theme.colors.text.secondary};
    --color-text-tertiary: ${({ theme }) => theme.colors.text.tertiary};
    --color-text-disabled: ${({ theme }) => theme.colors.text.disabled};
    --color-text-inverse: ${({ theme }) => theme.colors.text.inverse};
    
    /* Specific UI elements */
    --color-app-bar: ${({ theme }) => theme.colors.appBar};
    --color-app-bar-text: ${({ theme }) => theme.colors.appBarText};
    --color-focus-ring: ${({ theme }) => theme.colors.focusRing};
    
    /* Chart-specific colors */
    --color-chart-background: ${({ theme }) => theme.colors.chartBackground};
    --color-chart-border: ${({ theme }) => theme.colors.chartBorder};
    
    /* Sampling indicator */
    --sampling-indicator-bg: ${({ theme }) => theme.colors.samplingIndicator.background};
    --sampling-indicator-border: ${({ theme }) => theme.colors.samplingIndicator.border};
    --sampling-indicator-text: ${({ theme }) => theme.colors.samplingIndicator.text};
    --sampling-indicator-icon: ${({ theme }) => theme.colors.samplingIndicator.icon};
    
    /* Spacing */
    --spacing-xs: ${({ theme }) => theme.spacing.xs};
    --spacing-sm: ${({ theme }) => theme.spacing.sm};
    --spacing-md: ${({ theme }) => theme.spacing.md};
    --spacing-lg: ${({ theme }) => theme.spacing.lg};
    --spacing-xl: ${({ theme }) => theme.spacing.xl};
    
    /* Border radius */
    --border-radius-sm: ${({ theme }) => theme.borderRadius.sm};
    --border-radius-md: ${({ theme }) => theme.borderRadius.md};
    --border-radius-lg: ${({ theme }) => theme.borderRadius.lg};
    
    /* Transitions */
    --transition-fast: ${({ theme }) => theme.transitions.fast};
    --transition-normal: ${({ theme }) => theme.transitions.normal};
    --transition-slow: ${({ theme }) => theme.transitions.slow};
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  html, body {
    font-family: ${({ theme }) => theme.typography.fontFamily.body};
    font-size: 16px;
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text.primary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Typography scale */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${({ theme }) => theme.typography.fontFamily.body};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.tight};
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }

  h1 { font-size: ${({ theme }) => theme.typography.fontSize.xxxl}; }
  h2 { font-size: ${({ theme }) => theme.typography.fontSize.xxl}; }
  h3 { font-size: ${({ theme }) => theme.typography.fontSize.xl}; }
  h4 { font-size: ${({ theme }) => theme.typography.fontSize.lg}; }
  h5 { font-size: ${({ theme }) => theme.typography.fontSize.md}; }
  h6 { font-size: ${({ theme }) => theme.typography.fontSize.md}; }

  p {
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.fast};
    
    &:hover {
      color: ${({ theme }) => theme.mode === 'light' ? '#1565c0' : '#64b5f6'};
    }
  }

  button:focus, 
  a:focus, 
  input:focus, 
  select:focus, 
  textarea:focus {
    outline: 3px solid ${({ theme }) => theme.colors.focusRing};
    outline-offset: 2px;
  }

  /* Add IBM Plex Mono for code elements */
  code, pre {
    font-family: ${({ theme }) => theme.typography.fontFamily.mono};
    background-color: ${({ theme }) => 
      theme.mode === 'light' ? '#f5f7fa' : '#2a2a2a'};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }
  
  code {
    padding: 0.2em 0.4em;
    font-size: 0.9em;
  }
  
  pre {
    padding: ${({ theme }) => theme.spacing.md};
    overflow-x: auto;
    
    code {
      padding: 0;
      background-color: transparent;
    }
  }

  /* Global data sampling indicator styles */
  .sampling-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: var(--sampling-indicator-bg);
    border: 1px solid var(--sampling-indicator-border);
    border-radius: 4px;
    font-size: 12px;
    color: var(--sampling-indicator-text);
    z-index: 100;
  }

  .sampling-indicator svg {
    font-size: 16px;
    color: var(--sampling-indicator-icon);
  }

  .chart-sampling-notice {
    position: absolute;
    top: 8px;
    right: 8px;
  }

  .inline-sampling-notice {
    display: inline-flex;
    margin-left: 8px;
  }

  /* Custom component styles */
  .transformed-badge {
    background-color: ${({ theme }) => theme.mode === 'light' ? '#f0f4c3' : '#2c3308'} !important;
    color: ${({ theme }) => theme.mode === 'light' ? '#33691e' : '#c5e1a5'} !important;
  }
`; 