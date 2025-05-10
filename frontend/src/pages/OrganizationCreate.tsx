import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Breadcrumbs, 
  Link as MuiLink, 
  Paper 
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import OrganizationCreateForm from '../components/Organization/OrganizationCreateForm';
import { Organization } from '../interfaces';

const OrganizationCreate: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateSuccess = (organization: Organization) => {
    // Navigate to the new organization's page
    navigate(`/organizations/${organization.name}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs sx={{ mb: 4 }}>
        <MuiLink component={Link} to="/" color="inherit">
          Home
        </MuiLink>
        <MuiLink component={Link} to="/organizations" color="inherit">
          Organizations
        </MuiLink>
        <Typography color="text.primary">Create New Organization</Typography>
      </Breadcrumbs>

      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Create New Organization
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Organizations allow you to collaborate with others on repositories. 
          Create an organization to get started.
        </Typography>
      </Box>

      {/* Create organization form */}
      <Paper elevation={0} sx={{ backgroundColor: 'transparent' }}>
        <OrganizationCreateForm onSuccess={handleCreateSuccess} />
      </Paper>
    </Container>
  );
};

export default OrganizationCreate; 