import {
  Add as AddIcon,
  Business as BusinessIcon,
  Code as CodeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  GroupOutlined as GroupIcon,
  Logout as LeaveIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RepositoryWideCard from '../components/Repository/RepositoryWideCard';
import { useAuth } from '../contexts/AuthContext';
import { useOrganizationAddMember } from '../hooks/useOrganizationAddMember';
import { useOrganizationDetails } from '../hooks/useOrganizationDetails';
import { useUserSearch } from '../hooks/useUserSearch';
import { OrganizationMember, Repository } from '../interfaces';
import api from '../services/api';
import RepositoryService from '../services/RepositoryService';
import OrganizationService from '../services/OrganizationService';
import { getProfileImageUrl, getImageUrl } from '../utils/imageUtils';

// Tab Panel Component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`org-tabpanel-${index}`}
      aria-labelledby={`org-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function EmptyState({ message, action, actionLabel }: { message: string, action?: () => void, actionLabel?: string }) {
  return (
    <Box sx={{ py: 5, textAlign: 'center' }}>
      <Typography variant="body1" color="text.secondary" gutterBottom>{message}</Typography>
      {action && actionLabel && (
        <Button variant="outlined" onClick={action} sx={{ mt: 2 }}>{actionLabel}</Button>
      )}
    </Box>
  );
}

// Fix type issues with member.user
const renderAvatar = (member: OrganizationMember) => {
  const memberAny = member as any;
  if (memberAny?.profile_image_id) {
    return (
      <Avatar 
        src={getProfileImageUrl(memberAny.profile_image_id)}
        alt={memberAny.username || '?'}
      >
        {memberAny.username && memberAny.username.length > 0 ? memberAny.username[0].toUpperCase() : '?'}
      </Avatar>
    );
  }
  
  // Fallback
  return <Avatar>{memberAny?.username && memberAny.username.length > 0 ? memberAny.username[0].toUpperCase() : '?'}</Avatar>;
};

const renderMemberUsername = (member: OrganizationMember) => {
  if (member?.username) {
    return member.username;
  }
  
  // Fallback
  return 'Unknown User';
};

const renderMemberFullName = (member: OrganizationMember) => {
  // First try using the nested user object
  if (member?.full_name) {
    return member.full_name;
  }
  
  // Return username as fallback
  return renderMemberUsername(member);
};

const OrganizationProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const {
    organization,
    repositories,
    members,
    loading,
    error,
    isAdmin,
    isOwner,
    isMember,
    fetchOrganizationDetails,
    setRepositories
  } = useOrganizationDetails();

  const {
    addUsername,
    addLoading,
    addError,
    openAddDialog,
    setAddUsername,
    setOpenAddDialog,
    handleAddUser
  } = useOrganizationAddMember();

  const {
    searchQuery,
    setSearchQuery,
    users,
    loading: searchLoading,
    clearSearch
  } = useUserSearch();

  const [tabValue, setTabValue] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editData, setEditData] = useState<{ name: string; description: string }>({
    name: '',
    description: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Update edit data when organization changes
  useEffect(() => {
    if (organization) {
      setEditData({
        name: organization.display_name || organization.name || '',
        description: organization.description || ''
      });
    }
  }, [organization]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenEdit = () => {
    if (!organization) return;
    setEditData({
      name: organization.display_name || organization.name || '',
      description: organization.description || ''
    });
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(null);
    setOpenEditDialog(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Please upload a valid image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Image size must be less than 2MB');
      return;
    }

    setLogoFile(file);
    setLogoError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setLogoPreview(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async (): Promise<void> => {
    if (!logoFile || !organization?.id) return;

    setLogoUploading(true);
    setLogoError(null);

    try {
      await OrganizationService.uploadOrganizationLogo(organization.id, logoFile);
      await fetchOrganizationDetails(); // Refresh organization data
      setSnackbar({ open: true, message: 'Logo updated successfully', severity: 'success' });
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      setLogoError(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleEditOrganization = async () => {
    if (!organization?.id || !editData.name.trim()) return;
    setEditLoading(true);
    try {
      // Log the data being sent for debugging
      const updateData = {
        display_name: editData.name.trim(),
        description: editData.description.trim() || null
      };
      console.log('Updating organization with data:', updateData);
      console.log('Organization ID:', organization.id);

      // Update organization details
      await api.put(`/organizations/${organization.id}`, updateData);

      // Upload logo if a new one was selected
      if (logoFile) {
        await handleLogoUpload();
      }

      await fetchOrganizationDetails();
      setOpenEditDialog(false);
      setSnackbar({ open: true, message: 'Organization updated successfully', severity: 'success' });
    } catch (err: any) {
      console.error('Error updating organization:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Show more specific error message if available
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to update organization';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setEditLoading(false);
    }
  };
  
  const handleLeaveOrganization = async () => {
    if (!organization?.id || !user) return;
    setActionLoading(true);
    try {
      await api.delete(`/organizations/${organization.id}/leave`);
      navigate('/organizations');
    } catch (err: any) {
      console.error('Error leaving organization:', err);
      setSnackbar({ open: true, message: 'Failed to leave organization', severity: 'error' });
    } finally {
      setActionLoading(false);
      setConfirmLeaveOpen(false);
    }
  };
  
  const handleDeleteOrganization = async () => {
    if (!organization?.id || !isOwner) return;
    setActionLoading(true);
    try {
      await api.delete(`/organizations/${organization.id}`);
      navigate('/organizations');
    } catch (err: any) {
      console.error('Error deleting organization:', err);
      setSnackbar({ open: true, message: 'Failed to delete organization', severity: 'error' });
    } finally {
      setActionLoading(false);
      setConfirmDeleteOpen(false);
    }
  };
  
  const handleUpdateMemberRole = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    if (!organization?.id) return;
    try {
      await api.put(`/organizations/${organization.id}/members/${memberId}`, {
        role: newRole
      });
      await fetchOrganizationDetails(); // Wait for refresh
      setSnackbar({ 
        open: true, 
        message: `Member role updated to ${newRole.toLowerCase()} successfully`, 
        severity: 'success' 
      });
    } catch (err: any) {
      console.error('Error updating member role:', err);
      setSnackbar({ open: true, message: 'Failed to update member role', severity: 'error' });
    }
  };
  
  const handleRemoveMember = async (memberId: string) => {
    if (!organization?.id) return;
    try {
      await api.delete(`/organizations/${organization.id}/members/${memberId}`);
      await fetchOrganizationDetails(); // Wait for refresh
      setSnackbar({ 
        open: true, 
        message: 'Member removed from organization successfully', 
        severity: 'success' 
      });
    } catch (err: any) {
      console.error('Error removing member:', err);
      setSnackbar({ open: true, message: 'Failed to remove member', severity: 'error' });
    }
  };
  
  const handleCreateRepository = () => {
    if (!organization) return;
    navigate(`/repositories/new`);
  };
  
  const handleStarToggle = async (repoId: string, isStarred: boolean) => {
    if (!organization?.name) return;
    try {
      // Optimistically update UI first
      setRepositories((prevRepos: Repository[]) => 
        prevRepos.map((repo) => {
          if (repo.id === repoId) {
            // Adjust star count
            const currentStars = repo.stats?.stars || repo._count?.stars || 0;
            const newStarCount = isStarred ? Math.max(0, currentStars - 1) : currentStars + 1;
            
            return {
              ...repo,
              isStarred: !isStarred,
              is_starred: !isStarred,
              _count: {
                ...(repo._count || {}),
                stars: newStarCount
              },
              stats: {
                ...(repo.stats || {}),
                stars: newStarCount,
                is_starred: !isStarred
              }
            };
          }
          return repo;
        })
      );
      
      // Make API call
      if (isStarred) {
        await RepositoryService.unstarRepository(repoId);
      } else {
        await RepositoryService.starRepository(repoId);
      }
      
      setSnackbar({ 
        open: true, 
        message: isStarred ? 'Repository unstarred' : 'Repository starred', 
        severity: 'success' 
      });
    } catch (err: any) {
      console.error('Error toggling star:', err);
      setSnackbar({ open: true, message: 'Failed to update star status', severity: 'error' });
      // Refresh everything from server in case of error
      fetchOrganizationDetails();
    }
  };

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
    clearSearch();
    setAddUsername('');
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    clearSearch();
    setAddUsername('');
  };

  const handleUserSelect = (username: string) => {
    setAddUsername(username);
    setSearchQuery(username);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Loading organization...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Retrieving organization details and members
        </Typography>
      </Box>
    );
  }
  
  if (error || !organization) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, px: 3 }}>
        <Box sx={{ 
          width: 80, 
          height: 80, 
          borderRadius: '50%', 
          bgcolor: 'error.light', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 3
        }}>
          <BusinessIcon sx={{ fontSize: 40, color: 'error.contrastText' }} />
        </Box>
        <Typography variant="h5" color="error" gutterBottom>
          {organization ? 'Error Loading Organization' : 'Organization Not Found'}
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 500, mb: 4 }}>
          {error || 'The requested organization could not be found or you may not have permission to view it.'}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/organizations')}
        >
          Go to Organizations
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, width: '100%', height: '100%', overflow: 'auto', pt: 4 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 4 }}>
          {/* Organization Details - Left Side */}
          <Box sx={{ width: { xs: '100%', md: '30%' }, maxWidth: 320, mx: { xs: 'auto', md: 0 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={organization.logo_image_id ? getImageUrl(organization.logo_image_id) : undefined}
                alt={organization.name || ''}
                sx={{ width: 130, height: 130, mb: 2 }}
              >
                {organization.name && organization.name.length > 0 ? organization.name[0].toUpperCase() : '?'}
              </Avatar>

              {(isAdmin || isOwner) && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleOpenEdit}
                  size="small"
                  sx={{ mt: 2, mb: 3 }}
                >
                  Edit Organization
                </Button>
              )}
            </Box>

            <Typography variant="h4" fontWeight="bold" sx={{ mt: 3}}>
              {organization.display_name || organization.name || 'Unnamed Organization'}
            </Typography>
            
            <Typography variant="body1" color="text.secondary">@{organization.name || ''}</Typography>

            <Box sx={{ mt: 1 }}>
              {isMember && (
                <Chip
                  label={
                    isOwner ? 'Owner' :
                    isAdmin ? 'Admin' :
                    'Member'
                  }
                  size="small"
                  color={
                    isOwner ? 'secondary' :
                    isAdmin ? 'primary' :
                    'default'
                  }
                />
              )}
            </Box>
            
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1">
                {organization.description || 'No description provided'}
              </Typography>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Actions
              </Typography>
            </Box>
            <Box sx={{ mt: 1, display: 'flex',flexDirection: 'column', gap: 2 }}>
              {(isAdmin || isOwner) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddDialog}
                  color="primary"
                  fullWidth
                >
                  Add Member
                </Button>
              )}
              {/* {(isAdmin || isOwner) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateRepository}
                  color="secondary"
                  fullWidth
                >
                  Create Repository
                </Button>
              )} */}
              
              {isOwner ? (
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => setConfirmDeleteOpen(true)}
                  color="error"
                  fullWidth
                >
                  Delete Organization
                </Button>
              ) : isMember ? (
                <Button
                  variant="outlined"
                  startIcon={<LeaveIcon />}
                  onClick={() => setConfirmLeaveOpen(true)}
                  color="error"
                  fullWidth
                >
                  Leave Organization
                </Button>
              ) : null}
            </Box>
          </Box>

          {/* Repositories - Right Side */}
          <Box sx={{ flexGrow: 1, ml: 2}}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant={isMobile ? 'scrollable' : 'standard'}
            >
              <Tab 
                icon={<CodeIcon fontSize="small" />}
                iconPosition="start" 
                label={`Repositories (${repositories ? repositories.length : 0})`} 
              />
              <Tab 
                icon={<GroupIcon fontSize="small" />}
                iconPosition="start" 
                label={`Members (${members ? members.length : 0})`} 
              />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {repositories && repositories.length > 0 ? (
                <Grid container spacing={3}>
                  {repositories.map(repo => (
                    <Grid item xs={12} key={repo.id || `repo-${Math.random()}`}>
                      <RepositoryWideCard
                        repository={repo}
                        onStar={handleStarToggle}
                        profileImage={organization.logo_image_id ? getImageUrl(organization.logo_image_id) : undefined}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <EmptyState 
                  message={isAdmin || isOwner 
                    ? "This organization doesn't have any repositories yet." 
                    : "This organization doesn't have any repositories yet."}
                  action={isAdmin || isOwner ? handleCreateRepository : undefined}
                  actionLabel={isAdmin || isOwner ? "Create Repository" : undefined}
                />
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                {members && members.length > 0 ? (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      Click on a member card to view their profile
                    </Typography>
                    <Grid container spacing={3}>
                      {members.map((member) => {
                        if (!member || (!member.username && !member.id)) {
                          // Skip invalid member data
                          return null;
                        }
                        
                        return (
                          <Grid item xs={12} md={6} key={member.id || `member-${Math.random()}`}>
                            <Paper 
                              elevation={1} 
                              sx={{ 
                                p: 3, 
                                position: 'relative',
                                borderRadius: 2,
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                height: '140px', // Fixed height for uniform cards
                                display: 'flex',
                                flexDirection: 'column',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: 3
                                }
                              }}
                              onClick={() => navigate(`/profile/${renderMemberUsername(member)}`)}
                            >
                              {/* Membership badge in top right corner */}
                              <Chip
                                size="small"
                                label={member.role || 'MEMBER'}
                                color={member.role === 'OWNER' ? 'secondary' : member.role === 'ADMIN' ? 'primary' : 'default'}
                                sx={{ 
                                  position: 'absolute', 
                                  top: 12, 
                                  right: 12,
                                  fontSize: '0.75rem',
                                  height: '24px'
                                }}
                              />
                              
                              {/* Main content area */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                {/* Avatar */}
                                {renderAvatar(member)}
                                
                                {/* Member info */}
                                <Box sx={{ flexGrow: 1, overflow: 'hidden', pr: 1 }}>
                                  <Typography 
                                    variant="h6" 
                                    fontWeight="bold" 
                                    sx={{ 
                                      mb: 0.5, 
                                      textOverflow: 'ellipsis',
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                      fontSize: '1.1rem'
                                    }}
                                  >
                                    {renderMemberFullName(member)}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ 
                                      textOverflow: 'ellipsis',
                                      overflow: 'hidden', 
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    @{renderMemberUsername(member)}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {/* Admin actions - positioned at bottom */}
                              {(isAdmin || isOwner) && member.role !== 'OWNER' && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  gap: 1, 
                                  mt: 1.5,
                                  pt: 1,
                                  borderTop: '1px solid',
                                  borderColor: 'divider',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                  mx: -3,
                                  px: 3,
                                  pb: 1,
                                  borderRadius: '0 0 8px 8px'
                                }}>
                                  {isOwner && (
                                    <FormControl size="small" sx={{ minWidth: 100 }}>
                                      <Select
                                        value={member.role || 'MEMBER'}
                                        onChange={(e) => {
                                          e.stopPropagation(); // Prevent navigation
                                          handleUpdateMemberRole(member.id, e.target.value as 'ADMIN' | 'MEMBER');
                                        }}
                                        onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking the select
                                        disabled={actionLoading}
                                        sx={{ 
                                          fontSize: '0.875rem',
                                          backgroundColor: 'white',
                                          '& .MuiSelect-select': {
                                            py: 0.5
                                          }
                                        }}
                                      >
                                        <MenuItem value="ADMIN">Admin</MenuItem>
                                        <MenuItem value="MEMBER">Member</MenuItem>
                                      </Select>
                                    </FormControl>
                                  )}
                                  <IconButton 
                                    aria-label="remove member" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveMember(member.id);
                                    }}
                                    disabled={actionLoading}
                                    color="error"
                                    size="small"
                                    sx={{ 
                                      ml: 'auto',
                                      backgroundColor: 'white',
                                      border: '1px solid',
                                      borderColor: 'error.main',
                                      '&:hover': {
                                        backgroundColor: 'error.main',
                                        color: 'white',
                                        transform: 'scale(1.05)'
                                      },
                                      transition: 'all 0.2s ease-in-out'
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              )}
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </>
                ) : (
                  <EmptyState 
                    message="This organization doesn't have any members yet."
                    action={isAdmin || isOwner ? handleOpenAddDialog : undefined}
                    actionLabel={isAdmin || isOwner ? "Add Members" : undefined}
                  />
                )}
              </Paper>
            </TabPanel>
          </Box>
        </Box>

        {/* Edit Organization Dialog */}
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Logo Section */}
              <Grid item xs={12} md={4} sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <Avatar
                  src={logoPreview || (organization?.logo_image_id ? getImageUrl(organization.logo_image_id) : undefined)}
                  sx={{ width: 100, height: 100, mb: 2 }}
                >
                  {editData.name ? editData.name.charAt(0).toUpperCase() : <BusinessIcon sx={{ fontSize: 40 }} />}
                </Avatar>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="logo-upload-edit"
                  type="file"
                  onChange={handleLogoChange}
                />
                <label htmlFor="logo-upload-edit">
                  <Button 
                    variant="outlined" 
                    component="span" 
                    size="small" 
                    startIcon={<PhotoCameraIcon />}
                    disabled={logoUploading}
                  >
                    {logoFile ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                </label>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Max 2MB image
                </Typography>
                {logoError && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {logoError}
                  </Typography>
                )}
              </Grid>

              {/* Form Fields */}
              <Grid item xs={12} md={8}>
                <TextField
                  margin="normal"
                  label="Organization Display Name"
                  fullWidth
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
                <TextField
                  margin="normal"
                  label="Description"
                  fullWidth
                  multiline
                  rows={4}
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleEditOrganization} 
              color="primary" 
              disabled={!editData.name.trim() || editLoading || logoUploading}
            >
              {editLoading || logoUploading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Add Member</DialogTitle>
          <DialogContent>
            <Autocomplete
              freeSolo
              options={users}
              getOptionLabel={(option) => typeof option === 'string' ? option : option.username}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={option.profile_image_id ? getProfileImageUrl(option.profile_image_id) : undefined}
                    sx={{ width: 32, height: 32 }}
                  >
                    {option.username[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {option.full_name || option.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{option.username}
                    </Typography>
                  </Box>
                </Box>
              )}
              inputValue={searchQuery}
              onInputChange={(_, newValue) => setSearchQuery(newValue)}
              onChange={(_, value) => {
                if (value && typeof value === 'object') {
                  handleUserSelect(value.username);
                }
              }}
              loading={searchLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="normal"
                  label="Search Username"
                  fullWidth
                  placeholder="Type username to search..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            {addError && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {addError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddDialog}>Cancel</Button>
            <Button 
              onClick={() => handleAddUser(undefined, () => {
                setSnackbar({ 
                  open: true, 
                  message: `${addUsername} has been added to the organization successfully!`, 
                  severity: 'success' 
                });
              })} 
              color="primary" 
              disabled={!addUsername || addLoading}
            >
              {addLoading ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Leave Organization Confirmation Dialog */}
        <Dialog open={confirmLeaveOpen} onClose={() => setConfirmLeaveOpen(false)}>
          <DialogTitle>Leave Organization</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to leave {organization?.name || 'this organization'}?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmLeaveOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleLeaveOrganization} 
              color="error" 
              disabled={actionLoading}
            >
              {actionLoading ? 'Leaving...' : 'Leave'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Organization Confirmation Dialog */}
        <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
          <DialogTitle>Delete Organization</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Are you sure you want to delete {organization?.name || 'this organization'}? This action cannot be undone.
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              <strong>Warning:</strong> All repositories ({repositories?.length || 0}) and their prompts will be permanently deleted.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleDeleteOrganization} 
              color="error" 
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default OrganizationProfile; 