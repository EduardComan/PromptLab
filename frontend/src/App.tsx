import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PromptAnalytics from './pages/PromptAnalytics';
import Repository from './pages/Repository';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Organizations from './pages/Organizations';
import OrganizationDetail from './pages/OrganizationDetail';
import Search from './pages/Search';
import MergeRequest from './pages/MergeRequest';
import NotificationList from './pages/NotificationList';

// Layouts
import MainLayout from './components/Layout/MainLayout';

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</Box>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CssBaseline />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Main layout routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="analytics/:promptId" element={<PromptAnalytics />} />
            <Route path="repositories/:repoId" element={<Repository />} />
            <Route path="users/:username" element={<Profile />} />
            <Route path="merge-requests/:requestId" element={<MergeRequest />} />
            
            {/* Protected routes */}
            <Route 
              path="settings/*" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="organizations" 
              element={
                <ProtectedRoute>
                  <Organizations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="organizations/:orgId" 
              element={
                <ProtectedRoute>
                  <OrganizationDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="notifications" 
              element={
                <ProtectedRoute>
                  <NotificationList />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 