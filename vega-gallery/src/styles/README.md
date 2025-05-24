# Vega Gallery Theme System

This directory contains the theming system for Vega Gallery. It provides a comprehensive approach to styling with support for both light and dark modes.

## Architecture

The theme system is built using:
- **Styled Components** for component-level styling
- **CSS Variables** for global tokens
- **Material UI Theme Provider** for consistent Material UI components

## Directory Structure

- `tokens.ts` - Contains all design tokens (colors, spacing, typography, etc.)
- `theme.ts` - Defines light and dark themes using the tokens
- `ThemeProvider.tsx` - Context provider for theme management
- `GlobalStyles.tsx` - Global styles for the application
- `MuiThemeProvider.tsx` - Material UI theme integration

## Usage

### Using the theme in styled-components

```tsx
import styled from 'styled-components'

const StyledComponent = styled.div`
  color: ${props => props.theme.colors.text.primary};
  padding: ${props => props.theme.spacing.md};
`
```

### Using CSS variables

```css
.my-class {
  color: var(--color-text-primary);
  padding: var(--spacing-md);
}
```

### Accessing theme in components

```tsx
import { useTheme } from '../styles/ThemeProvider'

const MyComponent = () => {
  const { mode, toggleTheme, theme } = useTheme()
  
  return (
    <div>
      <p>Current theme mode: {mode}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  )
}
```

## Theme Structure

The theme is organized into the following categories:

- **colors** - All colors for the application
- **spacing** - Spacing values for padding, margins, etc.
- **typography** - Font families, sizes, weights, etc.
- **elevation** - Box shadows for different elevation levels
- **borderRadius** - Border radius values
- **zIndex** - Z-index values for layering
- **transitions** - Transition timing and easing
- **breakpoints** - Screen size breakpoints for responsive design
- **media** - Media query helpers

## Adding New Tokens

To add new tokens to the theme system:

1. Add the token to `tokens.ts`
2. Add it to both light and dark themes in `theme.ts`
3. Add corresponding CSS variables in `GlobalStyles.tsx` if needed
4. Update the Material UI theme in `MuiThemeProvider.tsx` if applicable 