import React, { useState, useRef } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Divider,
  Avatar
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProfileForm } from '../hooks/useProfileForm';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { getProfileImageUrl } from '../utils/imageUtils';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const {
    profileData,
    handleChange,
    handleSubmit,
    loading,
    notification,
    handleCloseNotification
  } = useProfileForm();

  // Image upload states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be smaller than 5MB');
      return;
    }

    setImageFile(file);
    setImageError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleImageUpload = async () => {
    if (!imageFile) return null;

    setImageUploading(true);
    setImageError(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post('/accounts/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newImageId = response.data.profile_image_id;
      
      // Update user data with new image ID
      if (updateUser) {
        updateUser({ profile_image_id: newImageId });
      }

      return newImageId;
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setImageError(err.response?.data?.message || 'Failed to upload image');
      throw err;
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    
    // Update user to remove image
    if (updateUser) {
      updateUser({ profile_image_id: undefined });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Upload image first if there's a new one
      if (imageFile) {
        await handleImageUpload();
      }
      
      // Then submit the form
      await handleSubmit(e);
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  const getImageSrc = () => {
    if (imagePreview) return imagePreview;
    if (user?.profile_image_id) return getProfileImageUrl(user.profile_image_id);
    return undefined;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton
            onClick={() => navigate('/profile')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Edit Profile
          </Typography>
        </Box>
        <Divider sx={{ mb: 4 }} />
        <Box component="form" onSubmit={handleFormSubmit}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Profile Image Section */}
              <Box sx={{ position: 'relative', mb: 3 }}>
                <Avatar
                  src={getImageSrc()}
                  alt={user?.full_name || user?.username || 'User'}
                  sx={{ 
                    width: 150, 
                    height: 150,
                    border: '4px solid white',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  {!getImageSrc() && (user?.full_name || user?.username || 'U')[0].toUpperCase()}
                </Avatar>
                
                {imageUploading && (
                  <CircularProgress
                    size={40}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: '-20px',
                      marginLeft: '-20px'
                    }}
                  />
                )}
              </Box>

              {/* Image Upload Controls */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                >
                  {imageFile ? 'Change Image' : 'Upload Image'}
                </Button>
                
                {(imageFile || user?.profile_image_id) && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleRemoveImage}
                    disabled={imageUploading}
                    size="small"
                  >
                    Remove Image
                  </Button>
                )}
              </Box>

              {/* Image Info */}
              {imageFile && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Selected: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}

              {/* Image Error */}
              {imageError && (
                <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                  {imageError}
                </Alert>
              )}
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleChange}
                    variant="outlined"
                    multiline
                    rows={4}
                    placeholder="Tell us about yourself"
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                disabled={loading || imageUploading}
                sx={{ px: 4, py: 1.5, borderRadius: 2 }}
              >
                {(loading || imageUploading) ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditProfile; 