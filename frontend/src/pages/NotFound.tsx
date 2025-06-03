import React, { useEffect } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }, 5000000);
    
    return () => clearTimeout(timer);
  }, [navigate, user]);
  
  const handleGoBack = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };
  
  return (
    <Container maxWidth="md">
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '70vh',
          textAlign: 'center'
        }}
      >
        <Typography variant="h1" component="h1"  sx={{ fontWeight: 800 }}>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Redirecting you to {user ? 'dashboard' : 'login'} in 5 seconds...
        </Typography>
      </Box>
    </Container>
  );
};

export default NotFound; 