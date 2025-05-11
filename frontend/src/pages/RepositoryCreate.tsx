import {
  Box,
  Container,
  Typography
} from '@mui/material';
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import NewRepositoryForm from '../components/Repository/NewRepositoryForm';
import { useAuth } from '../contexts/AuthContext';

const RepositoryCreate: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Get organization id from location state if provided (pass to NewRepositoryForm)
  const organizationId = location.state?.organizationId;

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ pt: 2, pb: 4 }}>
        <Box>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Create Repository
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 3, mb: 4 }}>
          Your prompt's home: track versions, customize inputs, and collaborate
        </Typography>
      </Box>
        
        <NewRepositoryForm initialOrgId={organizationId} />
    
      </Box>
    </Container>
  );
};

export default RepositoryCreate; 