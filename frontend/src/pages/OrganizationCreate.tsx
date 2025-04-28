import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import OrganizationCreateForm from '../components/Organization/OrganizationCreateForm';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const OrganizationCreate: React.FC = () => {
  const { user } = useAuth();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 2, pb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            mb: 4, 
            fontWeight: 700 
          }}
        >
          Create Organization
        </Typography>
        
        <OrganizationCreateForm />
        
        <Box
          sx={{
            mt: 4,
            p: 3,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" gutterBottom>
            What are organizations?
          </Typography>
          <Typography variant="body1" paragraph>
            Organizations help you collaborate with others on repositories. An organization can own repositories that
            multiple users can access and contribute to.
          </Typography>
          <Typography variant="body1" paragraph>
            As the creator, you'll be the organization's owner with full administrative rights. You can add members and
            assign them specific roles (Owner, Admin, Member) with different permissions.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Organization roles
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Owner:</strong> Full administrative control over the organization, including deleting it.
            Only one owner per organization.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Admin:</strong> Can manage repositories, members, and organization settings, 
            but cannot delete the organization.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Member:</strong> Can view all organization repositories and contribute according
            to repository permissions.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default OrganizationCreate; 