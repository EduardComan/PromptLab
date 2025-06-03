import React, { useState } from 'react';
import {
  Box, Button, TextField, Paper, Typography, Avatar, Grid,
  CircularProgress, Alert
} from '@mui/material';
import { Business as BusinessIcon, Group, PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
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
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    setOrgLogo(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setLogoPreview(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    const nameRegex = /^[a-z0-9-]+$/;
    if (!formData.name.trim()) errors.name = 'Organization name is required';
    else if (!nameRegex.test(formData.name)) errors.name = 'Only lowercase letters, numbers, hyphens allowed';

    if (!formData.display_name.trim()) errors.display_name = 'Display name is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Step 1: Create organization
      const { data } = await api.post('/organizations', formData);
      const organization = data.organization;

      // Step 2: Upload logo if available
      if (orgLogo && organization.id) {
        const logoFormData = new FormData();
        logoFormData.append('image', orgLogo); // Backend expects 'image'

        await api.post(`/organizations/${organization.id}/logo`, logoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setSuccess(true);
      onSuccess?.(organization);
      if (!isDialog) {
        setTimeout(() => navigate(`/organizations/${organization.name}`), 1000);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to create organization';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={isDialog ? 0 : 1} sx={{ p: isDialog ? 2 : 4, borderRadius: 2 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Organization Details
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Organization created successfully</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={4} sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: { md: '300px' }
          }}>
            <Avatar
              src={logoPreview || undefined}
              sx={{ width: 120, height: 120, mb: 3, bgcolor: 'primary.main' }}
            >
              {formData.display_name ? formData.display_name.charAt(0).toUpperCase() : <Group sx={{ fontSize: 60 }} />}
            </Avatar>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="logo-upload"
              type="file"
              onChange={handleLogoChange}
            />
            <label htmlFor="logo-upload">
              <Button variant="outlined" component="span" size="small" startIcon={<PhotoCameraIcon />}>
                Upload Logo
              </Button>
            </label>
            <Typography variant="caption" sx={{ mt: 1 }}>Max 2MB image</Typography>
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              label="Organization Tag"
              name="name"
              placeholder="my-organization"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!validationErrors.name}
              helperText={validationErrors.name || 'Hyphen separeted only e.g. my-org-nam'}
              inputProps={{ pattern: '[a-z0-9-]+' }}
              sx={{ mb: 3 }}
            />
            <TextField
              label="Display Name"
              name="display_name"
              value={formData.display_name}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!validationErrors.display_name}
              helperText={validationErrors.display_name || ''}
              sx={{ mb: 3 }}
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              {onCancel && <Button variant="outlined" onClick={onCancel}>Cancel</Button>}
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : undefined}
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default OrganizationCreateForm;