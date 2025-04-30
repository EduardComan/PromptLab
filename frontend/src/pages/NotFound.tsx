import React, { useEffect } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }, 5000);
    
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
        <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          We couldn't find the page you're looking for.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Redirecting you to {user ? 'dashboard' : 'login'} in 5 seconds...
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleGoBack}
          sx={{ mt: 2 }}
        >
          Go to {user ? 'Dashboard' : 'Login'}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound; 