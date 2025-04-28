import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Button,
  Grid,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import NewRepositoryForm from '../components/Repository/NewRepositoryForm';

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
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            mb: 4, 
            fontWeight: 700 
          }}
        >
          Create Repository
        </Typography>
        
        <NewRepositoryForm initialOrgId={organizationId} />
        
        <Box
          sx={{
            mt: 4,
            p: 3,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" gutterBottom>
            About repositories
          </Typography>
          <Typography variant="body1" paragraph>
            A repository contains all the files for your prompt project, including the prompt text, 
            variables, and version history.
          </Typography>
          <Typography variant="body1" paragraph>
            Repositories can be public or private. Public repositories are visible to anyone, 
            while private repositories are only visible to you and collaborators you invite.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RepositoryCreate; 