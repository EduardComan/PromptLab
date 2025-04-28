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
  ListItemSecondaryAction
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
  ExitToApp as LeaveIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RepositoryGrid from '../components/Repository/RepositoryGrid';
import { formatDistanceToNow } from 'date-fns';
import { organizationService } from '../services/OrganizationService';
import { Organization, OrganizationMember, User } from '../interfaces';
import api from '../services/api';

const OrganizationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editData, setEditData] = useState<{ name: string; description: string }>({
    name: '',
    description: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrganizationDetails = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [orgResponse, reposResponse, membersResponse] = await Promise.all([
        api.get(`/api/organizations/${id}`),
        api.get(`/api/organizations/${id}/repositories`),
        api.get(`/api/organizations/${id}/members`)
      ]);
      
      setOrganization(orgResponse.data);
      setRepositories(reposResponse.data);
      setMembers(membersResponse.data);
      
      // Check if current user is admin or owner
      if (user) {
        const currentMember = membersResponse.data.find((member: OrganizationMember) => member.user_id === user.id);
        if (currentMember) {
          setIsAdmin(currentMember.role === 'ADMIN' || currentMember.role === 'OWNER');
          setIsOwner(currentMember.role === 'OWNER');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load organization details');
      console.error('Error fetching organization details:', err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchOrganizationDetails();
  }, [fetchOrganizationDetails]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenInvite = () => {
    setInviteEmail('');
    setInviteRole('MEMBER');
    setInviteError(null);
    setOpenInviteDialog(true);
  };

  const handleInviteUser = async () => {
    if (!id || !inviteEmail.trim()) return;
    
    setInviteLoading(true);
    setInviteError(null);
    
    try {
      await api.post(`/api/organizations/${id}/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole
      });
      
      // Refresh members list
      const membersResponse = await api.get(`/api/organizations/${id}/members`);
      setMembers(membersResponse.data);
      
      setOpenInviteDialog(false);
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to invite user');
      console.error('Error inviting user:', err);
    } finally {
      setInviteLoading(false);
    }
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
    if (!id || !editData.name.trim()) return;
    
    setEditLoading(true);
    
    try {
      const response = await api.put(`/api/organizations/${id}`, {
        display_name: editData.name.trim(),
        description: editData.description.trim() || null
      });
      
      setOrganization(response.data);
      setOpenEditDialog(false);
    } catch (err: any) {
      console.error('Error updating organization:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleLeaveOrganization = async () => {
    if (!id || !user) return;
    
    setActionLoading(true);
    
    try {
      await api.delete(`/api/organizations/${id}/leave`);
      navigate('/organizations');
    } catch (err: any) {
      console.error('Error leaving organization:', err);
    } finally {
      setActionLoading(false);
      setConfirmLeaveOpen(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!id || !isOwner) return;
    
    setActionLoading(true);
    
    try {
      await api.delete(`/api/organizations/${id}`);
      navigate('/organizations');
    } catch (err: any) {
      console.error('Error deleting organization:', err);
    } finally {
      setActionLoading(false);
      setConfirmDeleteOpen(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    if (!id) return;
    
    try {
      await api.put(`/api/organizations/${id}/members/${memberId}/role`, {
        role: newRole
      });
      
      // Refresh members list
      const membersResponse = await api.get(`/api/organizations/${id}/members`);
      setMembers(membersResponse.data);
    } catch (err: any) {
      console.error('Error updating member role:', err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;
    
    try {
      await api.delete(`/api/organizations/${id}/members/${memberId}`);
      
      // Refresh members list
      const membersResponse = await api.get(`/api/organizations/${id}/members`);
      setMembers(membersResponse.data);
    } catch (err: any) {
      console.error('Error removing member:', err);
    }
  };

  const handleCreateRepository = () => {
    navigate(`/repositories/create?org=${id}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !organization) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'Organization not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Organization Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center">
          <Avatar
            src={organization.logo_image_id ? `/api/images/${organization.logo_image_id}` : undefined}
            alt={organization.display_name}
            sx={{ width: 80, height: 80, mr: 3 }}
          >
            {organization.display_name?.charAt(0) || organization.name.charAt(0)}
          </Avatar>
          
          <Box flex={1}>
            <Typography variant="h4" component="h1" gutterBottom>
              {organization.display_name || organization.name}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" gutterBottom>
              @{organization.name}
            </Typography>
            
            {organization.description && (
              <Typography variant="body1" paragraph>
                {organization.description}
              </Typography>
            )}
            
            <Box display="flex" gap={2} mt={1}>
              <Chip 
                icon={<CodeIcon fontSize="small" />} 
                label={`${organization.repository_count || repositories.length} Repositories`} 
                variant="outlined" 
              />
              <Chip 
                icon={<PersonIcon fontSize="small" />} 
                label={`${organization.member_count || members.length} Members`} 
                variant="outlined" 
              />
              <Chip 
                icon={<StarIcon fontSize="small" />} 
                label={`${organization.total_stars || 0} Stars`} 
                variant="outlined" 
              />
            </Box>
          </Box>
          
          <Box>
            {isAdmin && (
              <Button 
                startIcon={<EditIcon />} 
                variant="outlined" 
                onClick={handleOpenEdit}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
            )}
            
            {isOwner && (
              <Button 
                startIcon={<DeleteIcon />} 
                variant="outlined" 
                color="error"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                Delete
              </Button>
            )}
            
            {user && !isOwner && (
              <Button 
                startIcon={<LeaveIcon />} 
                variant="outlined" 
                color="warning"
                onClick={() => setConfirmLeaveOpen(true)}
              >
                Leave
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      {/* Organization Content Tabs */}
      <Paper elevation={1}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="organization tabs">
            <Tab label="Repositories" />
            <Tab label="Members" />
          </Tabs>
        </Box>
        
        {/* Repositories Tab */}
        <Box role="tabpanel" hidden={tabValue !== 0} p={3}>
          {tabValue === 0 && (
            <>
              {isAdmin && (
                <Box display="flex" justifyContent="flex-end" mb={2}>
                  <Button 
                    startIcon={<AddIcon />} 
                    variant="contained" 
                    color="primary"
                    onClick={handleCreateRepository}
                  >
                    Create Repository
                  </Button>
                </Box>
              )}
              
              {repositories.length > 0 ? (
                <RepositoryGrid repositories={repositories} />
              ) : (
                <Box display="flex" flexDirection="column" alignItems="center" p={4}>
                  <CodeIcon fontSize="large" color="disabled" sx={{ mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No repositories yet
                  </Typography>
                  {isAdmin && (
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />}
                      onClick={handleCreateRepository}
                      sx={{ mt: 2 }}
                    >
                      Create Repository
                    </Button>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>
        
        {/* Members Tab */}
        <Box role="tabpanel" hidden={tabValue !== 1} p={3}>
          {tabValue === 1 && (
            <>
              {isAdmin && (
                <Box display="flex" justifyContent="flex-end" mb={2}>
                  <Button 
                    startIcon={<AddIcon />} 
                    variant="contained" 
                    color="primary"
                    onClick={handleOpenInvite}
                  >
                    Invite Member
                  </Button>
                </Box>
              )}
              
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
              
              {members.length === 0 && (
                <Box display="flex" flexDirection="column" alignItems="center" p={4}>
                  <PersonIcon fontSize="large" color="disabled" sx={{ mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No members yet
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>

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
    </Container>
  );
};

export default OrganizationDetail; 