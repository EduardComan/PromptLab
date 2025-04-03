import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Avatar,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Delete as DeleteIcon,
  AddAPhoto as AddAPhotoIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Tab panel component for tab content
interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, logout } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  
  // Determine active tab based on URL
  useEffect(() => {
    const path = location.pathname.split('/').pop() || '';
    
    switch (path) {
      case 'profile':
        setTabValue(0);
        break;
      case 'notifications':
        setTabValue(1);
        break;
      case 'security':
        setTabValue(2);
        break;
      case 'account':
        setTabValue(3);
        break;
      default:
        setTabValue(0);
        navigate('/settings/profile', { replace: true });
    }
  }, [location, navigate]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/settings/profile');
        break;
      case 1:
        navigate('/settings/notifications');
        break;
      case 2:
        navigate('/settings/security');
        break;
      case 3:
        navigate('/settings/account');
        break;
      default:
        navigate('/settings/profile');
    }
  };
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Settings
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue}
            onChange={handleTabChange}
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<PersonIcon />} iconPosition="start" label="Profile" />
            <Tab icon={<NotificationsIcon />} iconPosition="start" label="Notifications" />
            <Tab icon={<SecurityIcon />} iconPosition="start" label="Security" />
            <Tab icon={<DeleteIcon />} iconPosition="start" label="Account" />
          </Tabs>
        </Box>
        
        <Routes>
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="notifications" element={<NotificationSettings />} />
          <Route path="security" element={<SecuritySettings />} />
          <Route path="account" element={<AccountSettings />} />
        </Routes>
      </Paper>
    </Container>
  );
};

const ProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
    bio: user?.bio || '',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    user?.profile_image_id ? `/api/images/${user.profile_image_id}` : null
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Update profile information
      const profileResponse = await api.put('/accounts/profile', {
        username: formData.username,
        full_name: formData.full_name,
        bio: formData.bio
      });
      
      // Upload profile image if changed
      if (profileImage) {
        const formData = new FormData();
        formData.append('image', profileImage);
        
        const imageResponse = await api.post('/accounts/profile-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        // Update user context with new image
        if (imageResponse.data.image) {
          updateUser({
            ...user!,
            profile_image_id: imageResponse.data.image.id
          });
        }
      }
      
      // Update user context with new profile info
      updateUser({
        ...user!,
        username: formData.username,
        full_name: formData.full_name,
        bio: formData.bio
      });
      
      setSuccess(true);
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
      setLoading(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Profile updated successfully!
        </Alert>
      )}
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            src={imagePreview || undefined}
            alt={user?.username}
            sx={{ width: 120, height: 120, mb: 2 }}
          >
            {user?.username.charAt(0).toUpperCase()}
          </Avatar>
          
          <Button
            component="label"
            variant="outlined"
            startIcon={<AddAPhotoIcon />}
            sx={{ mb: 2 }}
          >
            Upload Photo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>
          
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Recommended: Square image, at least 200x200 pixels.
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Email"
                name="email"
                value={formData.email}
                disabled
                fullWidth
                helperText="Email cannot be changed. Contact support for assistance."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                multiline
                rows={4}
                fullWidth
                placeholder="Tell others about yourself..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
              >
                Save Changes
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    email_notifications: true,
    comment_notifications: true,
    star_notifications: true,
    follow_notifications: true,
    merge_request_notifications: true,
    security_notifications: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/accounts/notification-settings');
        setSettings(response.data.settings);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching notification settings:', err);
        setError('Failed to load notification settings');
        setLoading(false);
      }
    };
    
    fetchNotificationSettings();
  }, []);
  
  const handleToggle = (setting: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };
  
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await api.put('/accounts/notification-settings', { settings });
      
      setSaving(false);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError('Failed to update notification settings');
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ pt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Notification settings updated successfully!
        </Alert>
      )}
      
      <Typography variant="h6" gutterBottom>
        Email Notifications
      </Typography>
      
      <List>
        <ListItem>
          <ListItemText
            primary="Email Notifications"
            secondary="Receive notifications via email"
          />
          <ListItemSecondaryAction>
            <Switch
              edge="end"
              checked={settings.email_notifications}
              onChange={() => handleToggle('email_notifications')}
            />
          </ListItemSecondaryAction>
        </ListItem>
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        Notification Types
      </Typography>
      
      <List>
        <ListItem>
          <ListItemText
            primary="Comments"
            secondary="Notifications about comments on your prompts"
          />
          <ListItemSecondaryAction>
            <Switch
              edge="end"
              checked={settings.comment_notifications}
              onChange={() => handleToggle('comment_notifications')}
            />
          </ListItemSecondaryAction>
        </ListItem>
        
        <ListItem>
          <ListItemText
            primary="Stars"
            secondary="Notifications when someone stars your repository"
          />
          <ListItemSecondaryAction>
            <Switch
              edge="end"
              checked={settings.star_notifications}
              onChange={() => handleToggle('star_notifications')}
            />
          </ListItemSecondaryAction>
        </ListItem>
        
        <ListItem>
          <ListItemText
            primary="Follows"
            secondary="Notifications when someone follows you"
          />
          <ListItemSecondaryAction>
            <Switch
              edge="end"
              checked={settings.follow_notifications}
              onChange={() => handleToggle('follow_notifications')}
            />
          </ListItemSecondaryAction>
        </ListItem>
        
        <ListItem>
          <ListItemText
            primary="Merge Requests"
            secondary="Notifications about merge requests on your repositories"
          />
          <ListItemSecondaryAction>
            <Switch
              edge="end"
              checked={settings.merge_request_notifications}
              onChange={() => handleToggle('merge_request_notifications')}
            />
          </ListItemSecondaryAction>
        </ListItem>
        
        <ListItem>
          <ListItemText
            primary="Security"
            secondary="Important security notifications"
          />
          <ListItemSecondaryAction>
            <Switch
              edge="end"
              checked={settings.security_notifications}
              onChange={() => handleToggle('security_notifications')}
              disabled
            />
          </ListItemSecondaryAction>
        </ListItem>
      </List>
      
      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={saving}
        >
          Save Settings
        </Button>
      </Box>
    </Box>
  );
};

const SecuritySettings: React.FC = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear password error when user types
    if (name === 'newPassword' || name === 'confirmPassword') {
      setPasswordError(null);
    }
  };
  
  const validatePasswords = () => {
    if (formData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await api.put('/accounts/change-password', {
        current_password: formData.currentPassword,
        new_password: formData.newPassword
      });
      
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.message || 'Failed to change password');
      setLoading(false);
    }
  };
  
  const securityItems = [
    {
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      status: 'Not enabled',
      action: '2FA is coming soon!'
    },
    {
      title: 'Connected Applications',
      description: 'Manage applications that have access to your account',
      status: '0 connected',
      action: 'Manage'
    },
    {
      title: 'Login History',
      description: 'See where you have logged in from',
      status: '',
      action: 'View'
    }
  ];
  
  return (
    <Box sx={{ pt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Password changed successfully!
        </Alert>
      )}
      
      <Typography variant="h6" gutterBottom>
        Change Password
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Current Password"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="New Password"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!passwordError}
              helperText={passwordError || 'At least 8 characters'}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!passwordError}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
            >
              Update Password
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Security Settings
      </Typography>
      
      <List>
        {securityItems.map((item, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <ListItemText
                primary={item.title}
                secondary={
                  <>
                    {item.description}
                    {item.status && (
                      <Typography variant="body2" component="span" sx={{ display: 'block', mt: 0.5 }}>
                        <strong>Status:</strong> {item.status}
                      </Typography>
                    )}
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Button size="small" disabled>
                  {item.action}
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
            {index < securityItems.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

const AccountSettings: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion');
      return;
    }
    
    try {
      setLoading(true);
      
      await api.delete('/accounts');
      
      // Log out the user
      logout();
      
      // Redirect to home page
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again later.');
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ pt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Account Management
      </Typography>
      
      <List>
        <ListItem>
          <ListItemText
            primary="Export Your Data"
            secondary="Download a copy of your data, including your repositories, prompts, and personal information"
          />
          <ListItemSecondaryAction>
            <Button size="small" disabled>
              Export (Coming Soon)
            </Button>
          </ListItemSecondaryAction>
        </ListItem>
        
        <Divider component="li" />
        
        <ListItem>
          <ListItemText
            primary="Delete Account"
            secondary="Permanently delete your account and all associated data"
            primaryTypographyProps={{
              color: 'error'
            }}
          />
          <ListItemSecondaryAction>
            <Button 
              color="error" 
              variant="outlined"
              onClick={() => setOpenDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
      
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Warning: This action cannot be undone. All your data will be permanently deleted, including:
          </DialogContentText>
          
          <Box component="ul" sx={{ mt: 1 }}>
            <li>All repositories and prompts you've created</li>
            <li>Your comments, stars, and other interactions</li>
            <li>Your profile information</li>
          </Box>
          
          <DialogContentText sx={{ mt: 2, mb: 2 }}>
            To confirm, please type <strong>DELETE</strong> in the field below:
          </DialogContentText>
          
          <TextField
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            fullWidth
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            Cancel
          </Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmation !== 'DELETE' || loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings; 