/**
 * Custom hooks for working with the theme system.
 */

import { useTheme as useStyledTheme } from 'styled-components';
import { useTheme as useCustomTheme } from './ThemeProvider';
import { Theme } from './theme';

/**
 * A hook that provides direct access to theme values without needing
 * to extract from props in a styled component.
 * 
 * Example usage:
 * ```tsx
 * const { colors, spacing } = useThemeValues();
 * return <div style={{ padding: spacing.md, color: colors.text.primary }}>Content</div>;
 * ```
 */
export const useThemeValues = () => {
  return useStyledTheme() as Theme;
};

/**
 * A hook that provides both the theme values and theme control functions.
 * 
 * Example usage:
 * ```tsx
 * const { theme, mode, toggleTheme } = useThemeContext();
 * return <button onClick={toggleTheme}>Switch to {mode === 'light' ? 'dark' : 'light'} mode</button>;
 * ```
 */
export const useThemeContext = () => {
  return useCustomTheme();
};

/**
 * A hook that creates a style object using theme values.
 * Useful for inline styling that needs theme values.
 * 
 * Example usage:
 * ```tsx
 * const styles = useThemedStyles(theme => ({
 *   container: {
 *     padding: theme.spacing.md,
 *     backgroundColor: theme.colors.surface,
 *   }
 * }));
 * 
 * return <div style={styles.container}>Content</div>;
 * ```
 */
export const useThemedStyles = <T extends Record<string, React.CSSProperties>>(
  stylesFn: (theme: Theme) => T
): T => {
  const theme = useThemeValues();
  return stylesFn(theme);
}; 