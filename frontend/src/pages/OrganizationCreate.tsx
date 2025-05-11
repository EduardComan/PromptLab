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
      <Box sx={{ mb: 5, textAlign: 'left' }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Organizations
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600}}>
          Collaborate more effectively through shared prompt spaces
        </Typography>
      </Box>

      <OrganizationCreateForm onSuccess={handleCreateSuccess} />

    </Container>
  );
};

export default OrganizationCreate; 