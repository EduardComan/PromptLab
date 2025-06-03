import {
  Box,
  Container,
  Typography
} from '@mui/material';
import React from 'react';
import { Navigate } from 'react-router-dom';
import NewRepositoryForm from '../components/Repository/NewRepositoryForm';
import { useAuth } from '../contexts/AuthContext';

const RepositoryCreate: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login"/>;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Create Repository
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
          Your prompt's home: track versions, customize prompts, and collaborate.
        </Typography>
        <NewRepositoryForm initialOrgId={user.id} />
      </Box>
    </Container>
  );
};

export default RepositoryCreate;