import React, { createContext, useState, useContext, useMemo, ReactNode } from 'react';
import { 
  ThemeProvider as MUIThemeProvider, 
  createTheme, 
  ThemeOptions,
  PaletteMode
} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

// Define the context type
type ThemeContextType = {
  mode: PaletteMode;
  toggleColorMode: () => void;
};

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use the theme context
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

// Define shared theme settings
const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode palette
          primary: {
            main: '#333333',
            light: '#555555',
            dark: '#000000',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#444',
            light: '#666',
            dark: '#222',
            contrastText: '#fff',
          },
          background: {
            default: '#fafafa',
            paper: '#ffffff',
          },
          text: {
            primary: '#212121',
            secondary: '#666666',
          },
        }
      : {
          // Dark mode palette
          primary: {
            main: '#eeeeee',
            light: '#ffffff',
            dark: '#cccccc',
            contrastText: '#000000',
          },
          secondary: {
            main: '#bbb',
            light: '#ddd',
            dark: '#999',
            contrastText: '#000',
          },
          background: {
            default: '#1a1a1a',
            paper: '#2c2c2c',
          },
          text: {
            primary: '#ffffff',
            secondary: '#bbbbbb',
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    body1: {
      fontWeight: 400,
    },
    body2: {
      fontWeight: 400,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: 'none',
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 16px',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'light' 
              ? '0 4px 8px rgba(0,0,0,0.1)' 
              : '0 4px 8px rgba(0,0,0,0.3)',
          },
        },
        contained: {
          backgroundColor: mode === 'light' ? '#333' : '#eee',
          color: mode === 'light' ? '#fff' : '#111',
          '&:hover': {
            backgroundColor: mode === 'light' ? '#000' : '#fff',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: mode === 'light' 
            ? '0 4px 20px rgba(0,0,0,0.05)' 
            : '0 4px 20px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: mode === 'light' ? '#f7f9fc' : '#3a3a3a',
            '& fieldset': {
              borderColor: mode === 'light' ? '#E0E0E0' : '#555',
            },
            '&:hover fieldset': {
              borderColor: mode === 'light' ? '#333' : '#999',
            },
            '&.Mui-focused fieldset': {
              borderColor: mode === 'light' ? '#333' : '#eee',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: mode === 'light' 
            ? '0 4px 20px rgba(0,0,0,0.05)' 
            : '0 4px 20px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: mode === 'light' 
            ? '0 2px 10px rgba(0,0,0,0.05)' 
            : '0 2px 10px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: mode === 'light' 
            ? '3px 0 15px rgba(0,0,0,0.05)' 
            : '3px 0 15px rgba(0,0,0,0.2)',
        },
      },
    },
  },
});

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get stored theme preference or default to light
  const storedMode = localStorage.getItem('themeMode') as PaletteMode | null;
  const [mode, setMode] = useState<PaletteMode>(storedMode || 'light');

  // Toggle between light and dark mode
  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  // Generate the theme based on current mode
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  // Context value
  const contextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 