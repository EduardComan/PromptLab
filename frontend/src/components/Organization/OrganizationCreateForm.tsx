import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Avatar,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  FormControlLabel,
  Switch,
  IconButton,
  Stack
} from '@mui/material';
import {
  Business as BusinessIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Organization } from '../../interfaces';

interface OrganizationCreateFormProps {
  onSuccess?: (organization: Organization) => void;
  onCancel?: () => void;
  isDialog?: boolean;
}

const OrganizationCreateForm: React.FC<OrganizationCreateFormProps> = ({
  onSuccess,
  onCancel,
  isDialog = false
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
  });
  const [orgLogo, setOrgLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }

      setOrgLogo(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setLogoPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Organization name is required');
      return false;
    }

    if (!formData.display_name.trim()) {
      setError('Display name is required');
      return false;
    }

    // Name validation (lowercase, no spaces, only dashes)
    const nameRegex = /^[a-z0-9-]+$/;
    if (!nameRegex.test(formData.name)) {
      setError('Name can only contain lowercase letters, numbers, and hyphens');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Create organization
      const response = await api.post('/organizations', {
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description,
      });
      
      const organization = response.data.organization;
      const orgId = organization.id;
      
      // Upload logo if provided
      if (orgLogo) {
        const logoFormData = new FormData();
        logoFormData.append('logo', orgLogo);
        
        await api.post(`/organizations/${orgId}/logo`, logoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      setSuccess(true);
      
      // If in dialog mode, call onSuccess
      if (isDialog && onSuccess) {
        onSuccess(organization);
      } else {
        // Otherwise redirect to organization page after a short delay
        setTimeout(() => {
          navigate(`/organizations/${organization.name}`);
        }, 1500);
      }
      
    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.response?.data?.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={isDialog ? 0 : 1}
      sx={{
        p: isDialog ? 2 : 4,
        borderRadius: 2,
        backgroundImage: isDialog ? 'none' : 'linear-gradient(to right, #f5f7fa, #c3cfe2)',
        mb: isDialog ? 0 : 4,
      }}
    >
      {!isDialog && (
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Create New Organization
        </Typography>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Organization created successfully! {isDialog ? '' : 'Redirecting...'}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 2
              }}
            >
              <Avatar
                src={logoPreview || undefined}
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  bgcolor: 'primary.main'
                }}
              >
                {formData.display_name ? formData.display_name.charAt(0).toUpperCase() : <BusinessIcon sx={{ fontSize: 60 }} />}
              </Avatar>
              
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="logo-upload"
                type="file"
                onChange={handleLogoChange}
              />
              <label htmlFor="logo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCameraIcon />}
                  size="small"
                >
                  Upload Logo
                </Button>
              </label>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Upload a square image, max 2MB
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Organization Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  helperText="Unique identifier (lowercase, no spaces)"
                  sx={{ mb: 2 }}
                  inputProps={{
                    pattern: '[a-z0-9-]+',
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Display Name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  helperText="How the organization appears to users"
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={4}
                  helperText="Tell users about your organization (optional)"
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Stack direction="row" spacing={2}>
              {isDialog && onCancel && (
                <Button 
                  variant="outlined" 
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
              
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                sx={{
                  background: 'linear-gradient(45deg, #4568dc, #b06ab3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #3457cb, #9f59a2)',
                  }
                }}
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default OrganizationCreateForm; 