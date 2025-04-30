import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserService from '../services/UserService';

// Define a simple profile state interface just for this component
interface ProfileFormData {
  full_name: string;
  bio: string;
}

const EditProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    full_name: '',
    bio: ''
  });
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Preview for the uploaded image
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        bio: user.bio || ''
      });
      
      // Set initial image preview
      if (user.profile_image_id) {
        setImagePreview(`/api/accounts/profile-image/${user.profile_image_id}`);
      } else if (user.picture_url) {
        setImagePreview(user.picture_url);
      }
    }
  }, [user]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      try {
        setUploadingImage(true);
        
        // Upload the image
        const result = await UserService.uploadProfileImage(file);
        
        // Update the user context with new profile image id
        if (updateUser && user) {
          updateUser({
            ...user,
            profile_image_id: result.profile_image_id
          });
        }
        
        setNotification({
          open: true,
          message: 'Profile image updated successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error uploading profile image:', error);
        setNotification({
          open: true,
          message: 'Failed to upload profile image',
          severity: 'error'
        });
      } finally {
        setUploadingImage(false);
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const updatedUser = await UserService.updateProfile({
        full_name: profileData.full_name,
        bio: profileData.bio
      });
      
      // Update the user in the auth context
      if (updateUser) {
        updateUser(updatedUser);
      }
      
      setNotification({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
      
      // Navigate back to profile after successful update
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({
        open: true,
        message: 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
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
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* Profile Image Section */}
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  position: 'relative',
                  width: 150,
                  height: 150,
                  mb: 2
                }}
              >
                <Avatar
                  src={imagePreview || undefined}
                  alt={user.username}
                  sx={{
                    width: 150,
                    height: 150,
                    cursor: 'pointer',
                    border: '4px solid white',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                  onClick={handleImageClick}
                >
                  {user.username[0].toUpperCase()}
                </Avatar>
                {uploadingImage && (
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="span"
                  onClick={handleImageClick}
                  disabled={uploadingImage}
                  sx={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'background.paper',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white'
                    }
                  }}
                >
                  <PhotoCameraIcon />
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                Click to upload a new profile image
              </Typography>
            </Grid>
            
            {/* Profile Details Section */}
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
            
            {/* Submit Button */}
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                disabled={loading}
                sx={{ px: 4, py: 1.5, borderRadius: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Notification */}
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