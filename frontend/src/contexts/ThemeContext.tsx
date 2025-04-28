import React, { ReactNode, createContext, useContext, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material';

// Define context type (simplified since we only have light theme now)
interface ThemeContextProps {
  mode: 'light';
}

// Create the context
export const ThemeContext = createContext<ThemeContextProps>({
  mode: 'light'
});

// Hook to use the theme context
export const useThemeMode = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Create the light theme
  const theme = useMemo(() => createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#4568dc',
        light: '#7895ff',
        dark: '#1e40a9',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#b06ab3',
        light: '#e398e6',
        dark: '#7f3f83',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f9fafb',
        paper: '#ffffff',
      },
      text: {
        primary: '#212121',
        secondary: '#666666',
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: {
            borderRadius: 12,
          },
        },
      },
    },
  }), []);

  // Context value (simplified)
  const themeContextValue = useMemo(
    () => ({
      mode: 'light' as const,
    }),
    []
  );
  
  return (
    <ThemeContext.Provider value={themeContextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 