import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Avatar, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormControlLabel,
  Switch
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Add as AddIcon,
  Code as CodeIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RepositoryGrid from '../components/Repository/RepositoryGrid';

interface Organization {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  logo_image?: {
    id: string;
  };
  created_at: string;
  updated_at: string;
  repositories_count: number;
  members_count: number;
  is_member: boolean;
  is_admin: boolean;
}

interface Member {
  id: string;
  user_id: string;
  org_id: string;
  role: string;
  joined_at: string;
  user: {
    id: string;
    username: string;
    profile_image?: {
      id: string;
    };
  };
}

const OrganizationDetail: React.FC = () => {
  const { orgName } = useParams<{ orgName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  
  useEffect(() => {
    if (orgName) {
      fetchOrganizationData();
    }
  }, [orgName]);
  
  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      
      // Fetch organization details
      const orgResponse = await api.get(`/organizations/${orgName}`);
      setOrganization(orgResponse.data.organization);
      
      // Fetch repositories
      const reposResponse = await api.get(`/organizations/${orgName}/repositories`);
      setRepositories(reposResponse.data.repositories);
      
      // Fetch members
      const membersResponse = await api.get(`/organizations/${orgName}/members`);
      setMembers(membersResponse.data.members);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching organization data:', err);
      setError('Failed to load organization data');
      setLoading(false);
    }
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleJoinOrganization = async () => {
    if (!organization) return;
    
    try {
      await api.post(`/organizations/${organization.id}/join`);
      
      // Refresh data
      fetchOrganizationData();
    } catch (err) {
      console.error('Error joining organization:', err);
      setError('Failed to join organization');
    }
  };
  
  const handleLeaveOrganization = async () => {
    if (!organization || !user) return;
    
    try {
      await api.delete(`/organizations/${organization.id}/leave`);
      
      // If the user is leaving, redirect to organizations list
      navigate('/organizations');
    } catch (err) {
      console.error('Error leaving organization:', err);
      setError('Failed to leave organization');
    }
  };
  
  const handleCreateRepository = () => {
    if (!organization) return;
    navigate(`/repositories/new?org=${organization.id}`);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !organization) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error || 'Organization not found'}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={organization.logo_image ? `/api/images/${organization.logo_image.id}` : undefined}
            alt={organization.name}
            sx={{ width: 100, height: 100, mr: 3 }}
          >
            {organization.name.charAt(0).toUpperCase()}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h4" component="h1">
                {organization.name}
              </Typography>
              <Chip 
                label={organization.is_public ? "Public" : "Private"} 
                size="small" 
                color={organization.is_public ? "success" : "default"}
                sx={{ ml: 2 }}
              />
            </Box>
            
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {organization.description || 'No description available'}
            </Typography>
            
            <Box sx={{ display: 'flex', mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                <strong>{organization.members_count}</strong> members
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{organization.repositories_count}</strong> repositories
              </Typography>
            </Box>
          </Box>
          
          <Box>
            {!organization.is_member && user ? (
              <Button 
                variant="contained" 
                onClick={handleJoinOrganization}
              >
                Join Organization
              </Button>
            ) : organization.is_member && !organization.is_admin ? (
              <Button 
                variant="outlined" 
                color="error"
                onClick={handleLeaveOrganization}
              >
                Leave Organization
              </Button>
            ) : organization.is_admin && (
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />}
                onClick={() => setOpenEditDialog(true)}
              >
                Edit Organization
              </Button>
            )}
          </Box>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="organization tabs"
          >
            <Tab icon={<CodeIcon />} iconPosition="start" label="Repositories" />
            <Tab icon={<PeopleIcon />} iconPosition="start" label="Members" />
            {organization.is_admin && (
              <Tab icon={<SettingsIcon />} iconPosition="start" label="Settings" />
            )}
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Repositories
            </Typography>
            
            {organization.is_member && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleCreateRepository}
              >
                New Repository
              </Button>
            )}
          </Box>
          
          {repositories.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No repositories found.
              </Typography>
              {organization.is_member && (
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
          ) : (
            <RepositoryGrid repositories={repositories} />
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Members ({members.length})
            </Typography>
            
            {organization.is_admin && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setOpenInviteDialog(true)}
              >
                Invite Member
              </Button>
            )}
          </Box>
          
          {members.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No members found.
            </Typography>
          ) : (
            <List>
              {members.map((member, index) => (
                <React.Fragment key={member.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar
                        src={member.user.profile_image ? `/api/images/${member.user.profile_image.id}` : undefined}
                        alt={member.user.username}
                        onClick={() => navigate(`/users/${member.user.username}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        {member.user.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body1" 
                          component="span"
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/users/${member.user.username}`)}
                        >
                          {member.user.username}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={member.role === 'admin' ? 'Admin' : 'Member'} 
                            size="small"
                            color={member.role === 'admin' ? 'primary' : 'default'}
                            sx={{ mr: 1 }}
                          />
                        </Box>
                      }
                    />
                    {organization.is_admin && user?.id !== member.user_id && (
                      <ListItemSecondaryAction>
                        <Button 
                          size="small" 
                          variant="outlined"
                          disabled
                        >
                          Manage
                        </Button>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                  {index < members.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>
        
        {organization.is_admin && (
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Organization Settings
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Danger Zone
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff8f8' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1" color="error">
                      Delete this organization
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Once deleted, it cannot be recovered.
                    </Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    color="error"
                    disabled
                  >
                    Delete Organization
                  </Button>
                </Box>
              </Paper>
            </Box>
          </TabPanel>
        )}
      </Paper>
      
      {/* Invite Member Dialog */}
      <InviteMemberDialog 
        open={openInviteDialog}
        onClose={() => setOpenInviteDialog(false)}
        organizationId={organization.id}
        onMemberInvited={fetchOrganizationData}
      />
      
      {/* Edit Organization Dialog */}
      <EditOrganizationDialog 
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        organization={organization}
        onOrganizationUpdated={fetchOrganizationData}
      />
    </Container>
  );
};

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

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  onMemberInvited: () => void;
}

const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({ 
  open, 
  onClose, 
  organizationId, 
  onMemberInvited 
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleRoleChange = (event: SelectChangeEvent) => {
    setRole(event.target.value);
  };
  
  const handleInvite = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await api.post(`/organizations/${organizationId}/invite`, {
        email,
        role
      });
      
      setSuccess(true);
      setEmail('');
      
      // Refresh members list
      onMemberInvited();
      
      // Close dialog after a delay
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error inviting member:', err);
      setError(err.response?.data?.message || 'Failed to invite member');
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Invite Member</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Invitation sent successfully!
          </Alert>
        )}
        
        <DialogContentText>
          Enter the email address of the person you want to invite to this organization.
        </DialogContentText>
        
        <TextField
          margin="dense"
          label="Email Address"
          type="email"
          fullWidth
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2, mt: 2 }}
          InputProps={{
            startAdornment: <EmailIcon sx={{ color: 'text.secondary', mr: 1 }} />
          }}
        />
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="role-select-label">Role</InputLabel>
          <Select
            labelId="role-select-label"
            value={role}
            label="Role"
            onChange={handleRoleChange}
          >
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleInvite} 
          variant="contained"
          disabled={loading || !email}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Send Invitation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface EditOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  organization: Organization;
  onOrganizationUpdated: () => void;
}

const EditOrganizationDialog: React.FC<EditOrganizationDialogProps> = ({ 
  open, 
  onClose, 
  organization,
  onOrganizationUpdated
}) => {
  const [formData, setFormData] = useState({
    name: organization.name,
    description: organization.description,
    is_public: organization.is_public
  });
  const [orgLogo, setOrgLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    organization.logo_image ? `/api/images/${organization.logo_image.id}` : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
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
      setOrgLogo(file);
      
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
  
  const handleSubmit = async () => {
    if (!formData.name) {
      setError('Organization name is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Update organization
      await api.put(`/organizations/${organization.id}`, {
        name: formData.name,
        description: formData.description,
        is_public: formData.is_public
      });
      
      // Upload logo if changed
      if (orgLogo) {
        const logoFormData = new FormData();
        logoFormData.append('logo', orgLogo);
        
        await api.post(`/organizations/${organization.id}/logo`, logoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      setSuccess(true);
      
      // Refresh organization data
      onOrganizationUpdated();
      
      // Close dialog after a delay
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error updating organization:', err);
      setError(err.response?.data?.message || 'Failed to update organization');
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Organization</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Organization updated successfully!
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 2 }}>
          <Avatar
            src={logoPreview || undefined}
            sx={{ width: 80, height: 80, mr: 2 }}
          >
            {formData.name ? formData.name.charAt(0).toUpperCase() : organization.name.charAt(0).toUpperCase()}
          </Avatar>
          
          <Button
            component="label"
            variant="outlined"
            size="small"
          >
            Change Logo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleLogoChange}
            />
          </Button>
        </Box>
        
        <TextField
          label="Organization Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        
        <TextField
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          multiline
          rows={3}
          fullWidth
          sx={{ mb: 2 }}
        />
        
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_public}
                onChange={handleInputChange}
                name="is_public"
              />
            }
            label={`This organization is ${formData.is_public ? 'public' : 'private'}`}
          />
          <Typography variant="caption" color="text.secondary">
            Public organizations are visible to all users. Private organizations are only visible to members.
          </Typography>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading || !formData.name}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizationDetail; 