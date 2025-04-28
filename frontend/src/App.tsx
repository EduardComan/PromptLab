import React from 'react';
import { Route, Navigate, Routes, Outlet } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import OrganizationDetail from './pages/OrganizationDetail';
import OrganizationCreate from './pages/OrganizationCreate';
import Organizations from './pages/Organizations';
import Repository from './pages/Repository';
import RepositoryCreate from './pages/RepositoryCreate';
import Terms from './pages/Terms';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Discover from './pages/Discover';
import NotFound from './pages/NotFound';
import { CircularProgress, Box, CssBaseline } from '@mui/material';
import './App.css';
import MainLayout from './components/Layout/MainLayout';

// Protected route component that checks for authentication
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
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
  
  return children;
};

// Modified MainLayout to include Outlet
const LayoutWithOutlet = () => {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          <Route element={<LayoutWithOutlet />}>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/organizations/:orgId" element={<OrganizationDetail />} />
            <Route path="/org/:orgName" element={<OrganizationDetail />} />
            <Route path="/users/:username" element={<Profile />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route 
              path="/organizations/new" 
              element={
                <ProtectedRoute>
                  <OrganizationCreate />
                </ProtectedRoute>
              } 
            />
            <Route path="/repositories/:repoId" element={<Repository />} />
            <Route 
              path="/repositories/new" 
              element={
                <ProtectedRoute>
                  <RepositoryCreate />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-repositories" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 