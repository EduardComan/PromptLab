import React from 'react';
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
import { useProfileForm } from '../hooks/useProfileForm';
import { useImageUpload } from '../hooks/useImageUpload';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const {
    profileData,
    handleChange,
    handleSubmit,
    loading,
    notification,
    handleCloseNotification
  } = useProfileForm();
  const {
    imagePreview,
    uploadingImage,
    fileInputRef,
    handleImageClick,
    handleImageChange
  } = useImageUpload();

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
                  alt={profileData.full_name || 'User'}
                  sx={{
                    width: 150,
                    height: 150,
                    cursor: 'pointer',
                    border: '4px solid white',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                  onClick={handleImageClick}
                >
                  {(profileData.full_name ? profileData.full_name[0] : 'U').toUpperCase()}
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
                disabled={loading}
                sx={{ px: 4, py: 1.5, borderRadius: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
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