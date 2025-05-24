import { ReactNode, useMemo } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { useTheme } from './ThemeProvider';

interface MuiThemeProviderProps {
  children: ReactNode;
}

export const MuiThemeProvider = ({ children }: MuiThemeProviderProps) => {
  const { theme } = useTheme();
  
  // Create a Material UI theme based on our styled-components theme
  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: theme.mode,
      primary: {
        main: theme.colors.primary,
      },
      secondary: {
        main: theme.colors.secondary,
      },
      error: {
        main: theme.colors.error,
      },
      warning: {
        main: theme.colors.warning,
      },
      info: {
        main: theme.colors.info,
      },
      success: {
        main: theme.colors.success,
      },
      background: {
        default: theme.colors.background,
        paper: theme.colors.surface,
      },
      text: {
        primary: theme.colors.text.primary,
        secondary: theme.colors.text.secondary,
        disabled: theme.colors.text.disabled,
      },
    },
    typography: {
      fontFamily: theme.typography.fontFamily.body,
      fontSize: 16,
      h1: {
        fontSize: theme.typography.fontSize.xxxl,
        fontWeight: theme.typography.fontWeight.semibold,
      },
      h2: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.semibold,
      },
      h3: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.semibold,
      },
      h4: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
      },
      h5: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
      },
      h6: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
      },
      button: {
        textTransform: 'none',
        fontWeight: theme.typography.fontWeight.medium,
      },
    },
    shape: {
      borderRadius: parseInt(theme.borderRadius.md.replace('px', '')),
    },
    spacing: (factor: number) => {
      const spacingMap = {
        0: theme.spacing.none,
        1: theme.spacing.xs,
        2: theme.spacing.sm,
        3: theme.spacing.md,
        4: theme.spacing.lg,
        5: theme.spacing.xl,
        6: theme.spacing.xxl,
        8: theme.spacing.xxxl,
      };
      // @ts-ignore
      return spacingMap[factor] || `${factor * 8}px`;
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: theme.borderRadius.md,
            textTransform: 'none',
            fontWeight: theme.typography.fontWeight.medium,
            padding: '8px 16px',
          },
          contained: {
            backgroundColor: theme.mode === 'dark' ? theme.colors.primary : theme.colors.primary,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: theme.mode === 'dark' ? '#2979ff' : '#1565c0',
            },
          },
          outlined: {
            borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
            color: theme.mode === 'dark' ? theme.colors.text.primary : theme.colors.text.primary,
            '&:hover': {
              backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            },
          },
          text: {
            color: theme.mode === 'dark' ? theme.colors.primary : theme.colors.primary,
            '&:hover': {
              backgroundColor: theme.mode === 'dark' ? 'rgba(25, 118, 210, 0.12)' : 'rgba(25, 118, 210, 0.08)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.elevation.md,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: theme.colors.text.secondary,
            '&:hover': {
              backgroundColor: theme.colors.surfaceHover,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: theme.colors.appBar,
            color: theme.colors.appBarText,
            boxShadow: theme.elevation.sm,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: theme.colors.sideNav,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: theme.mode === 'dark' ? '#424242' : '#ffffff',
            border: theme.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: theme.mode === 'dark' 
              ? '0 4px 12px rgba(0, 0, 0, 0.5)' 
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
            '&:hover': {
              backgroundColor: theme.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            '&.Mui-selected': {
              color: theme.mode === 'dark' ? theme.colors.primary : theme.colors.primary,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: theme.colors.primary,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
            color: theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            fontSize: theme.typography.fontSize.xs,
            fontWeight: 400,
            padding: '6px 10px',
            borderRadius: '4px',
          },
          arrow: {
            color: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
          }
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor: theme.mode === 'dark' ? 'rgba(30, 30, 30, 0.4)' : 'rgba(0, 0, 0, 0.04)',
            borderRadius: '6px',
            padding: '2px',
          },
          grouped: {
            margin: '2px',
            borderRadius: '4px !important',
            border: 'none',
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            backgroundColor: theme.mode === 'dark' ? 'rgba(30, 30, 30, 0.6)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
            color: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            boxShadow: theme.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
            '&.Mui-selected': {
              backgroundColor: theme.mode === 'dark' ? 'rgba(66, 165, 245, 0.3)' : 'rgba(25, 118, 210, 0.12)',
              color: theme.mode === 'dark' ? '#90caf9' : '#1976d2',
              boxShadow: theme.mode === 'dark' ? '0 0 5px rgba(66, 165, 245, 0.5)' : 'none',
              '&:hover': {
                backgroundColor: theme.mode === 'dark' ? 'rgba(66, 165, 245, 0.4)' : 'rgba(25, 118, 210, 0.2)',
              },
            },
            '&:hover': {
              backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
          sizeSmall: {
            padding: '4px 8px',
          },
        },
      },
    },
  }), [theme]);

  return (
    <MUIThemeProvider theme={muiTheme}>
      {children}
    </MUIThemeProvider>
  );
}; 