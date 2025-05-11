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
  Stack,
  Snackbar
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

    // Name validation (lowercase, no spaces, only dashes and alphanumeric)
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
      setError(null);
      
      // Create organization using the correct endpoint and payload structure
      const response = await api.post('/organizations', {
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description,
      });
      
      const organization = response.data.organization;
      
      // Upload logo if provided
      if (orgLogo && organization.id) {
        try {
          const logoFormData = new FormData();
          logoFormData.append('logo', orgLogo);
          
          await api.post(`/organizations/${organization.id}/logo`, logoFormData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } catch (logoError) {
          console.error('Error uploading logo, but organization was created:', logoError);
          // Continue with success flow even if logo upload fails
        }
      }
      
      setSuccess(true);
      
      // If in dialog mode, call onSuccess
      if (isDialog && onSuccess) {
        onSuccess(organization);
        setLoading(false);
      } else {
        // Otherwise redirect to organization page immediately
        navigate(`/organizations/${organization.name}`);
      }
      
    } catch (err: any) {
      console.error('Error creating organization:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create organization. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={isDialog ? 0 : 1}
      sx={{
        p: isDialog ? 2 : 4,
        borderRadius: 2,
        backgroundColor: 'rgba(245, 247, 250, 0.85)',
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
      
      {success && !isDialog && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Organization created successfully! Redirecting...
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
                  helperText="Unique identifier (lowercase, hyphens, no spaces)"
                  sx={{ mb: 2 }}
                  inputProps={{
                    pattern: '[a-z0-9-]+',
                  }}
                  disabled={loading}
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
                  helperText="Name displayed to users"
                  sx={{ mb: 2 }}
                  disabled={loading}
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
                  rows={3}
                  helperText="A short description of your organization"
                  sx={{ mb: 2 }}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {onCancel && (
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
                color="primary"
                disabled={loading || success}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Create Organization'
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default OrganizationCreateForm; 