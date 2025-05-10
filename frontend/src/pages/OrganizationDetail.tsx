import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Alert,
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
  useMediaQuery
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Star as StarIcon,
  AdminPanelSettings as AdminIcon,
  MoreVert as MoreIcon,
  Logout as LeaveIcon,
  GroupOutlined as GroupIcon,
  LinkOutlined as LinkIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RepositoryGrid, { Repository } from '../components/Repository/RepositoryGrid';
import RepositoryWideCard from '../components/Repository/RepositoryWideCard';
import { formatDistanceToNow } from 'date-fns';
import { organizationService } from '../services/OrganizationService';
import { Organization, OrganizationMember, User } from '../interfaces';
import api from '../services/api';
import { useOrganizationDetails } from '../hooks/useOrganizationDetails';
import { useOrganizationInvite } from '../hooks/useOrganizationInvite';

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

const OrganizationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
    fetchOrganizationDetails
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
  const [loadingStars, setLoadingStars] = useState<Record<string, boolean>>({});

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenEdit = () => {
    if (!organization) return;
    setEditData({
      name: organization.display_name || '',
      description: organization.description || ''
    });
    setOpenEditDialog(true);
  };

  const handleEditOrganization = async () => {
    if (!organization?.id || !editData.name.trim()) return;
    setEditLoading(true);
    try {
      const response = await api.put(`/organizations/${organization.id}`, {
        display_name: editData.name.trim(),
        description: editData.description.trim() || null
      });
      fetchOrganizationDetails();
      setOpenEditDialog(false);
    } catch (err: any) {
      console.error('Error updating organization:', err);
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
    } finally {
      setActionLoading(false);
      setConfirmDeleteOpen(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    if (!organization?.id) return;
    try {
      await api.put(`/organizations/${organization.id}/members/${memberId}/role`, {
        role: newRole
      });
      fetchOrganizationDetails();
    } catch (err: any) {
      console.error('Error updating member role:', err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organization?.id) return;
    try {
      await api.delete(`/organizations/${organization.id}/members/${memberId}`);
      fetchOrganizationDetails();
    } catch (err: any) {
      console.error('Error removing member:', err);
    }
  };

  const handleCreateRepository = () => {
    navigate(`/repositories/create?org=${id}`);
  };

  const handleStarToggle = async (repoId: string, isStarred: boolean) => {
    if (!organization?.id) return;
    try {
      if (isStarred) {
        await api.delete(`/repositories/${repoId}/star`);
      } else {
        await api.post(`/repositories/${repoId}/star`);
      }
      fetchOrganizationDetails();
    } catch (err) {
      console.error('Error toggling star:', err);
      fetchOrganizationDetails();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !organization) {
    return (
      <Box sx={{ py: 3 }}>
        <Typography color="error">{error || 'Organization not found'}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        width: '100%',
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <Container 
        maxWidth="xl" 
        sx={{ 
          py: 4,
          px: { xs: 2, sm: 3 },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Organization Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            pb: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            mb: 3,
            gap: { xs: 2, md: 5 },
            maxWidth: '100%',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Left side with avatar and details */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: { xs: 'center', md: 'flex-start' },
              width: { xs: '100%', md: '30%' },
              minWidth: { md: '250px' },
              maxWidth: { xs: '100%', md: '320px' },
              flexShrink: 0,
              mx: { xs: 'auto', md: 0 },
            }}
          >
            <Avatar
              src={organization.logo_image_id ? `/api/images/${organization.logo_image_id}` : undefined}
              alt={organization.name}
              sx={{ 
                width: 130, 
                height: 130,
                mb: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {(organization.display_name || organization.name)[0].toUpperCase()}
            </Avatar>
            
            {/* Edit buttons - only show if admin or owner */}
            {isAdmin && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleOpenEdit}
                size="small"
                sx={{ 
                  mb: 2, 
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 2,
                  py: 0.5
                }}
              >
                Edit Organization
              </Button>
            )}
            
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {organization.display_name || organization.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              @{organization.name}
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, mb: 3, maxWidth: '100%' }}>
              {organization.description || 'No description provided'}
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1.5, 
              mb: 3,
              width: '100%'
            }}>
              <Chip 
                icon={<CodeIcon fontSize="small" />} 
                label={`${repositories.length} Repositories`} 
                variant="outlined" 
              />
              <Chip 
                icon={<PersonIcon fontSize="small" />} 
                label={`${members.length} Members`} 
                variant="outlined" 
              />
            </Box>
            
            {/* Members section */}
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="h6" sx={{ 
                mb: 2, 
                fontWeight: 600, 
                borderBottom: '1px solid', 
                borderColor: 'divider',
                pb: 1,
              }}>
                Members
              </Typography>
              {members.length > 0 ? (
                <List sx={{ 
                  maxHeight: '300px',
                  overflow: 'auto',
                  '& .MuiListItem-root': {
                    px: 0,
                    py: 1
                  }
                }}>
                  {members.slice(0, 5).map((member) => (
                    <ListItem key={member.id} disableGutters>
                      <ListItemAvatar>
                        <Avatar 
                          src={member.user?.profile_image_id ? `/api/images/${member.user.profile_image_id}` : undefined}
                          alt={member.user?.username || ''}
                          sx={{ width: 36, height: 36 }}
                        >
                          {member.user?.username?.charAt(0) || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={member.user?.full_name || member.user?.username || 'Unknown User'}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            @{member.user?.username || 'unknown'}
                            {member.role === 'OWNER' && (
                              <Chip label="Owner" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                            )}
                            {member.role === 'ADMIN' && (
                              <Chip label="Admin" size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem' }} />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  No members
                </Typography>
              )}
              
              {members.length > 5 && (
                <Button 
                  fullWidth 
                  variant="text" 
                  onClick={() => setTabValue(1)}
                  sx={{ mt: 1, textTransform: 'none' }}
                >
                  View all {members.length} members
                </Button>
              )}
              
              {isAdmin && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenInviteDialog(true)}
                  sx={{ mt: 2, borderRadius: 2 }}
                >
                  Invite Member
                </Button>
              )}
            </Box>

            {/* Organization actions */}
            <Box sx={{ mt: 3, width: '100%', display: 'flex', gap: 1 }}>
              {isOwner && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setConfirmDeleteOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Delete
                </Button>
              )}
              
              {user && !isOwner && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  startIcon={<LeaveIcon />}
                  onClick={() => setConfirmLeaveOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Leave
                </Button>
              )}
            </Box>
          </Box>
          
          {/* Right side with tabs and content */}
          <Box sx={{ 
            flexGrow: 1,
            width: { xs: '100%', md: 'calc(70% - 5px)' },
            overflow: 'hidden',
            minWidth: 0, // This is crucial for flexbox to allow children to shrink below their content size
          }}>
            {/* Tabs */}
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                mb: 2,
                borderBottom: 1, 
                borderColor: 'divider',
                '& .MuiTabs-flexContainer': {
                  flexWrap: isMobile ? 'wrap' : 'nowrap',
                },
              }}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : undefined}
            >
              <Tab 
                label={`Repositories ${repositories.length}`} 
                sx={{ textTransform: 'none', fontWeight: 500 }} 
              />
              <Tab 
                label={`Members ${members.length}`} 
                sx={{ textTransform: 'none', fontWeight: 500 }} 
              />
            </Tabs>

            {/* Repositories Tab */}
            <TabPanel value={tabValue} index={0}>
              {isAdmin && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateRepository}
                    sx={{ borderRadius: 2 }}
                  >
                    Create Repository
                  </Button>
                </Box>
              )}
              
              {repositories.length > 0 ? (
                <Grid container spacing={3}>
                  {repositories.map((repository) => (
                    <Grid item xs={12} key={repository.id}>
                      <RepositoryWideCard 
                        repository={repository} 
                        onStar={handleStarToggle}
                        profileImage={organization.logo_image_id ? 
                          `/api/images/${organization.logo_image_id}` : undefined}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 6,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    No repositories found
                  </Typography>
                  {isAdmin && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleCreateRepository}
                    >
                      Create Repository
                    </Button>
                  )}
                </Box>
              )}
            </TabPanel>

            {/* Members Tab */}
            <TabPanel value={tabValue} index={1}>
              {isAdmin && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenInviteDialog(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    Invite Member
                  </Button>
                </Box>
              )}
              
              {members.length > 0 ? (
                <List>
                  {members.map((member) => (
                    <ListItem key={member.id} divider>
                      <ListItemAvatar>
                        <Avatar 
                          src={member.user?.profile_image_id ? `/api/images/${member.user.profile_image_id}` : undefined}
                          alt={member.user?.username || ''}
                        >
                          {member.user?.username?.charAt(0) || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText 
                        primary={
                          <Box display="flex" alignItems="center">
                            <Typography variant="body1">
                              {member.user?.full_name || member.user?.username || 'Unknown User'}
                            </Typography>
                            {member.role === 'OWNER' && (
                              <Chip 
                                label="Owner" 
                                size="small" 
                                color="primary" 
                                sx={{ ml: 1 }} 
                              />
                            )}
                            {member.role === 'ADMIN' && (
                              <Chip 
                                label="Admin" 
                                size="small" 
                                color="secondary" 
                                sx={{ ml: 1 }} 
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            @{member.user?.username || 'unknown'}
                          </Typography>
                        }
                      />
                      
                      {isAdmin && member.user_id !== user?.id && (
                        <ListItemSecondaryAction>
                          {isOwner && member.role !== 'OWNER' && (
                            <FormControl variant="outlined" size="small" sx={{ minWidth: 120, mr: 1 }}>
                              <Select
                                value={member.role}
                                onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as 'ADMIN' | 'MEMBER')}
                                displayEmpty
                              >
                                <MenuItem value="ADMIN">Admin</MenuItem>
                                <MenuItem value="MEMBER">Member</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                          
                          {(isOwner || (isAdmin && member.role === 'MEMBER')) && (
                            <IconButton edge="end" onClick={() => handleRemoveMember(member.id)}>
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 6,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    No members found
                  </Typography>
                  {isAdmin && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenInviteDialog(true)}
                      sx={{ mt: 2 }}
                    >
                      Invite Member
                    </Button>
                  )}
                </Box>
              )}
            </TabPanel>
          </Box>
        </Box>
      </Container>

      {/* Invite Member Dialog */}
      <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Member</DialogTitle>
        <DialogContent>
          {inviteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {inviteError}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth variant="outlined">
            <InputLabel>Role</InputLabel>
            <Select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')}
              label="Role"
              disabled={!isOwner}
            >
              {isOwner && <MenuItem value="ADMIN">Admin</MenuItem>}
              <MenuItem value="MEMBER">Member</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInviteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleInviteUser} 
            variant="contained" 
            color="primary"
            disabled={inviteLoading || !inviteEmail.trim()}
          >
            {inviteLoading ? <CircularProgress size={24} /> : 'Invite'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Organization</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Display Name"
            fullWidth
            value={editData.name}
            onChange={(e) => setEditData({...editData, name: e.target.value})}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={editData.description}
            onChange={(e) => setEditData({...editData, description: e.target.value})}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleEditOrganization} 
            variant="contained" 
            color="primary"
            disabled={editLoading || !editData.name.trim()}
          >
            {editLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Leave Dialog */}
      <Dialog open={confirmLeaveOpen} onClose={() => setConfirmLeaveOpen(false)}>
        <DialogTitle>Leave Organization</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to leave this organization? You will lose access to all private repositories.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLeaveOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleLeaveOrganization} 
            variant="contained" 
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Leave'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete Organization</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this organization? This action cannot be undone.
            All repositories, prompts, and other data will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteOrganization} 
            variant="contained" 
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationDetail;