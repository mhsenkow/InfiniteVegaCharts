import { 
  palette, 
  spacing, 
  typography, 
  elevation, 
  borderRadius, 
  breakpoints, 
  zIndex, 
  transitions 
} from './tokens';

// Type definitions for our theme
export type ThemeMode = 'light' | 'dark';

// Shared theme structure that's independent of theme mode
const baseTheme = {
  spacing,
  typography,
  elevation,
  borderRadius,
  zIndex,
  transitions,
  breakpoints,
  // Media query helpers
  media: {
    xs: `@media (min-width: ${breakpoints.xs})`,
    sm: `@media (min-width: ${breakpoints.sm})`,
    md: `@media (min-width: ${breakpoints.md})`,
    lg: `@media (min-width: ${breakpoints.lg})`,
    xl: `@media (min-width: ${breakpoints.xl})`,
    xxl: `@media (min-width: ${breakpoints.xxl})`,
  }
};

// Light theme colors
export const lightTheme = {
  ...baseTheme,
  mode: 'light' as ThemeMode,
  colors: {
    // Semantic colors
    primary: palette.blue600,
    secondary: palette.gray600,
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    info: palette.info,
    
    // Content/background colors
    background: palette.gray50,
    surface: '#ffffff',
    surfaceHover: palette.gray100,
    surfaceActive: palette.gray200,
    
    // Border colors
    border: palette.gray300,
    
    // Text colors
    text: {
      primary: palette.gray900,
      secondary: palette.gray700,
      tertiary: palette.gray600,
      disabled: palette.gray500,
      inverse: '#ffffff',
    },
    
    // Specific component colors
    appBar: '#ffffff',
    appBarText: palette.gray800,
    sideNav: '#ffffff',
    tooltip: palette.gray800,
    
    // Specific UI elements
    focusRing: `${palette.blue300}80`, // 50% opacity
    
    // Chart-specific colors
    chartBackground: '#ffffff',
    chartBorder: palette.gray300,
    
    // Sampling indicator
    samplingIndicator: {
      background: '#fffce8',
      border: '#ffe58f',
      text: '#755c0d',
      icon: '#f5a623',
    },
  },
};

// Dark theme colors
export const darkTheme = {
  ...baseTheme,
  mode: 'dark' as ThemeMode,
  colors: {
    // Semantic colors
    primary: palette.blue400,
    secondary: palette.gray500,
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    info: palette.info,
    
    // Content/background colors
    background: palette.darkBg,
    surface: palette.darkSurface,
    surfaceHover: '#2c2c2c',
    surfaceActive: '#333333',
    
    // Border colors
    border: palette.darkBorder,
    
    // Text colors
    text: {
      primary: '#ffffff',
      secondary: palette.gray300,
      tertiary: palette.gray400,
      disabled: palette.gray600,
      inverse: palette.gray900,
    },
    
    // Specific component colors
    appBar: palette.darkSurface,
    appBarText: '#ffffff',
    sideNav: palette.darkSurface,
    tooltip: palette.gray200,
    
    // Specific UI elements
    focusRing: `${palette.blue700}80`, // 50% opacity
    
    // Chart-specific colors
    chartBackground: '#1e1e1e',
    chartBorder: '#333333',
    
    // Sampling indicator
    samplingIndicator: {
      background: '#332b00',
      border: '#664a00',
      text: '#ffd666',
      icon: '#ffc53d',
    },
  },
};

// Default export the light theme
export default lightTheme;

// Type definition for our theme to be used with styled-components
export type Theme = typeof lightTheme; 