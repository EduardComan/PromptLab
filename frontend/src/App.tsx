import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import './App.css';
import MainLayout from './components/Layout/MainLayout';

import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Organizations from './pages/Organizations';
import OrganizationProfile from './pages/OrganizationProfile';
import OrganizationCreate from './pages/OrganizationCreate';
import Prompt from './pages/Prompt';
import RepositoryCreate from './pages/RepositoryCreate';
import Terms from './pages/Terms';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';


const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Protected route component that wraps with MainLayout for consistent UI
const ProtectedLayoutRoute = ({ element }: { element: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <MainLayout>
      {element}
    </MainLayout>
  );
};

// Public route component for already authenticated users
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          {/* Protected routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedLayoutRoute element={<Dashboard />} />} />
          <Route path="/discover" element={<ProtectedLayoutRoute element={<Discover />} />} />
          <Route path="/organizations/:id" element={<ProtectedLayoutRoute element={<OrganizationProfile />} />} />
          {/* <Route path="/org/:name" element={<ProtectedLayoutRoute element={<OrganizationProfile />} />} /> */}
          <Route path="/users/:username" element={<ProtectedLayoutRoute element={<Profile />} />} />
          <Route path="/profile" element={<ProtectedLayoutRoute element={<Profile />} />} />
          <Route path="/profile/edit" element={<ProtectedLayoutRoute element={<EditProfile />} />} />
          <Route path="/profile/:username" element={<ProtectedLayoutRoute element={<Profile />} />} />
          <Route path="/organizations" element={<ProtectedLayoutRoute element={<Organizations />} />} />
          <Route path="/organizations/new" element={<ProtectedLayoutRoute element={<OrganizationCreate />} />} />
          <Route path="/prompts/:promptId" element={<ProtectedLayoutRoute element={<Prompt />} />} />
          <Route path="/repositories/new" element={<ProtectedLayoutRoute element={<RepositoryCreate />} />} />

          {/* Public routes - redirect to dashboard if already authenticated */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          
          {/* Public routes that are accessible to all users */}
          <Route path="/terms" element={<Terms />} />
          
          {/* Catch all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 