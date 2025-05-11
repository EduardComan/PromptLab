import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Grid,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemSecondaryAction,
  useTheme,
  useMediaQuery,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Logout as LeaveIcon,
  GroupOutlined as GroupIcon,
  Business as BusinessIcon,
  AdminPanelSettings as AdminIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RepositoryWideCard from '../components/Repository/RepositoryWideCard';
import { Organization, OrganizationMember } from '../interfaces';
import api from '../services/api';
import { useOrganizationDetails } from '../hooks/useOrganizationDetails';
import { useOrganizationInvite } from '../hooks/useOrganizationInvite';
import RepositoryService from '../services/RepositoryService';
import { Repository } from '../components/Repository/RepositoryGrid';

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
  // First try using the nested user object
  if (member?.user?.profile_image_id) {
    return (
      <Avatar 
        src={`/api/accounts/profile-image/${member.user.profile_image_id}`}
        alt={member.user.username}
      >
        {member.user.username ? member.user.username[0].toUpperCase() : '?'}
      </Avatar>
    );
  }
  
  // If the member data is flattened (not nested under 'user')
  // Use type assertion to handle potentially flattened data
  const memberAny = member as any;
  if (memberAny?.profile_image_id) {
    return (
      <Avatar 
        src={`/api/accounts/profile-image/${memberAny.profile_image_id}`}
        alt={memberAny.username || '?'}
      >
        {memberAny.username ? memberAny.username[0].toUpperCase() : '?'}
      </Avatar>
    );
  }
  
  // Fallback
  return <Avatar>?</Avatar>;
};

const renderMemberUsername = (member: OrganizationMember) => {
  // First try using the nested user object
  if (member?.user?.username) {
    return member.user.username;
  }
  
  // If the member data is flattened (not nested under 'user')
  // Use type assertion to handle potentially flattened data
  const memberAny = member as any;
  if (memberAny?.username) {
    return memberAny.username;
  }
  
  // Fallback
  return 'Unknown User';
};

const renderMemberFullName = (member: OrganizationMember) => {
  // First try using the nested user object
  if (member?.user?.full_name) {
    return member.user.full_name;
  }
  
  // If the member data is flattened (not nested under 'user')
  // Use type assertion to handle potentially flattened data
  const memberAny = member as any;
  if (memberAny?.full_name) {
    return memberAny.full_name;
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
    fetchOrganizationDetails,
    setRepositories
  } = useOrganizationDetails();

  const {
    inviteEmail,
    inviteRole,
    inviteLoading,
    inviteError,
    openInviteDialog,
    setInviteEmail,
    setInviteRole,
    setOpenInviteDialog,
    handleInviteUser
  } = useOrganizationInvite();

  const [tabValue, setTabValue] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editData, setEditData] = useState<{ name: string; description: string }>({
    name: '',
    description: ''
  });
  const [editLoading, setEditLoading] = useState(false);
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
    setOpenEditDialog(true);
  };

  const handleEditOrganization = async () => {
    if (!organization?.name || !editData.name.trim()) return;
    setEditLoading(true);
    try {
      await api.put(`/organizations/${organization.name}`, {
        display_name: editData.name.trim(),
        description: editData.description.trim() || null
      });
      fetchOrganizationDetails();
      setOpenEditDialog(false);
      setSnackbar({ open: true, message: 'Organization updated successfully', severity: 'success' });
    } catch (err: any) {
      console.error('Error updating organization:', err);
      setSnackbar({ open: true, message: 'Failed to update organization', severity: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleLeaveOrganization = async () => {
    if (!organization?.name || !user) return;
    setActionLoading(true);
    try {
      await api.delete(`/organizations/${organization.name}/leave`);
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
    if (!organization?.name || !isOwner) return;
    setActionLoading(true);
    try {
      await api.delete(`/organizations/${organization.name}`);
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
    if (!organization?.name) return;
    try {
      await api.put(`/organizations/${organization.name}/members/${memberId}/role`, {
        role: newRole
      });
      fetchOrganizationDetails();
      setSnackbar({ open: true, message: 'Member role updated', severity: 'success' });
    } catch (err: any) {
      console.error('Error updating member role:', err);
      setSnackbar({ open: true, message: 'Failed to update member role', severity: 'error' });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organization?.name) return;
    try {
      await api.delete(`/organizations/${organization.name}/members/${memberId}`);
      fetchOrganizationDetails();
      setSnackbar({ open: true, message: 'Member removed', severity: 'success' });
    } catch (err: any) {
      console.error('Error removing member:', err);
      setSnackbar({ open: true, message: 'Failed to remove member', severity: 'error' });
    }
  };

  const handleCreateRepository = () => {
    if (!organization) return;
    navigate(`/repositories/create?org=${organization.name}`);
  };

  const handleStarToggle = async (repoId: string, isStarred: boolean) => {
    if (!organization?.name) return;
    try {
      let updatedStars = 0;
      
      if (isStarred) {
        const result = await RepositoryService.unstarRepository(repoId);
        updatedStars = result.stars;
      } else {
        const result = await RepositoryService.starRepository(repoId);
        updatedStars = result.stars;
      }
      
      // Update repositories with accurate star count
      setRepositories((prevRepos: Repository[]) => 
        prevRepos.map((repo) => {
          if (repo.id === repoId) {
            return {
              ...repo,
              isStarred: !isStarred,
              is_starred: !isStarred,
              stars_count: updatedStars,
              // Update _count object
              _count: {
                ...(repo._count || {}),
                stars: updatedStars
              }
            };
          }
          return repo;
        })
      );
      
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
            <Avatar
              src={organization.logo_image_id ? `/api/images/${organization.logo_image_id}` : undefined}
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
                sx={{ mb: 3 }}
              >
                Edit Organization
              </Button>
            )}

            <Typography variant="h4" fontWeight="bold">
              {organization.display_name || organization.name || 'Unnamed Organization'}
            </Typography>
            <Typography variant="body1" color="text.secondary">@{organization.name || ''}</Typography>
            
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1">
                {organization.description || 'No description provided'}
              </Typography>
            </Box>

            <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(isAdmin || isOwner) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenInviteDialog(true)}
                  color="primary"
                  fullWidth
                >
                  Invite Member
                </Button>
              )}
              {(isAdmin || isOwner) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateRepository}
                  color="secondary"
                  fullWidth
                >
                  Create Repository
                </Button>
              )}
              
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
              ) : user ? (
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
          <Box sx={{ flexGrow: 1 }}>
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
                        profileImage={organization.logo_image_id ? `/api/images/${organization.logo_image_id}` : undefined}
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
                      Click on a member to view their profile
                    </Typography>
                    <List>
                      {members.map((member) => {
                        if (!member || (!member.user && !member.user_id)) {
                          // Skip invalid member data
                          return null;
                        }
                        
                        return (
                          <ListItem 
                            key={member.id || `member-${Math.random()}`} 
                            divider
                            button
                            onClick={() => navigate(`/profile/${renderMemberUsername(member)}`)}
                            sx={{ cursor: 'pointer' }}
                            secondaryAction={
                              (isAdmin || isOwner) && member.role !== 'OWNER' && (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  {isOwner && (
                                    <FormControl size="small" sx={{ width: 120 }}>
                                      <Select
                                        value={member.role || 'MEMBER'}
                                        onChange={(e) => {
                                          e.stopPropagation(); // Prevent navigation
                                          handleUpdateMemberRole(member.id, e.target.value as 'ADMIN' | 'MEMBER');
                                        }}
                                        onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking the select
                                        disabled={actionLoading}
                                      >
                                        <MenuItem value="ADMIN">Admin</MenuItem>
                                        <MenuItem value="MEMBER">Member</MenuItem>
                                      </Select>
                                    </FormControl>
                                  )}
                                  <IconButton 
                                    edge="end" 
                                    aria-label="delete" 
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent navigation
                                      handleRemoveMember(member.id);
                                    }}
                                    disabled={actionLoading}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              )
                            }
                          >
                            <ListItemAvatar>
                              {renderAvatar(member)}
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                  <Typography variant="body1" fontWeight="medium">
                                    {renderMemberFullName(member)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                    @{renderMemberUsername(member)}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Chip
                                    size="small"
                                    label={member.role || 'MEMBER'}
                                    color={member.role === 'OWNER' ? 'primary' : member.role === 'ADMIN' ? 'secondary' : 'default'}
                                  />
                                </Box>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </>
                ) : (
                  <EmptyState 
                    message="This organization doesn't have any members yet."
                    action={isAdmin || isOwner ? () => setOpenInviteDialog(true) : undefined}
                    actionLabel={isAdmin || isOwner ? "Invite Members" : undefined}
                  />
                )}
              </Paper>
            </TabPanel>
          </Box>
        </Box>

        {/* Edit Organization Dialog */}
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogContent>
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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleEditOrganization} 
              color="primary" 
              disabled={!editData.name.trim() || editLoading}
            >
              {editLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Invite Member Dialog */}
        <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogContent>
            <TextField
              margin="normal"
              label="Email Address"
              type="email"
              fullWidth
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteRole}
                label="Role"
                onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')}
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="MEMBER">Member</MenuItem>
              </Select>
            </FormControl>
            {inviteError && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {inviteError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenInviteDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => handleInviteUser()} 
              color="primary" 
              disabled={!inviteEmail || inviteLoading}
            >
              {inviteLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Leave Organization Confirmation Dialog */}
        <Dialog open={confirmLeaveOpen} onClose={() => setConfirmLeaveOpen(false)}>
          <DialogTitle>Leave Organization</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to leave {organization?.name || 'this organization'}? You will lose access to all organization repositories.
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
            <Typography>
              Are you sure you want to delete {organization?.name || 'this organization'}? This action cannot be undone and all repositories will be deleted.
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