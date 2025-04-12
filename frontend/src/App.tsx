import React from 'react';
import { Route, Navigate, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import OrganizationDetail from './pages/OrganizationDetail';
import Repository from './pages/Repository';
import Terms from './pages/Terms';
import AppLayout from './components/Layout/AppLayout';
import './App.css';

// Protected route component that checks for authentication
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    // You can add a loading spinner here
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terms" element={<Terms />} />
          
          {/* Main layout with protected routes */}
          <Route path="/" element={<AppLayout />}>
            <Route 
              index
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings/*" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/organizations/:orgId" 
              element={
                <ProtectedRoute>
                  <OrganizationDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/repositories/:repoId" 
              element={
                <ProtectedRoute>
                  <Repository />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirect any unknown paths to dashboard if logged in, or login if not */}
            <Route 
              path="*" 
              element={
                <ProtectedRoute>
                  <Navigate to="/" replace />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 