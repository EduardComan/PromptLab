import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import OrganizationCreateForm from '../components/Organization/OrganizationCreateForm';
import { Organization } from '../interfaces';

const OrganizationCreate: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateSuccess = (organization: Organization) => {
    // Navigate to the new organization's page
    navigate(`/organizations/${organization.name}`);
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {/* Page header */}
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Create New Organization
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Organizations allow you to collaborate with others on repositories. 
          Create an organization to get started.
        </Typography>
      </Box>

      {/* Create organization form */}
      <Paper 
        elevation={0} 
        sx={{ 
          backgroundColor: 'background.paper',
          p: 4,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <OrganizationCreateForm onSuccess={handleCreateSuccess} />
      </Paper>
    </Container>
  );
};

export default OrganizationCreate; 