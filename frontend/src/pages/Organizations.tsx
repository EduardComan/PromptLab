import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
  is_admin: boolean;
}

const Organizations: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [publicOrganizations, setPublicOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openNewOrgDialog, setOpenNewOrgDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  useEffect(() => {
    fetchOrganizations();
  }, []);
  
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      // Fetch user's organizations
      const userOrgsResponse = await api.get('/organizations/me');
      setOrganizations(userOrgsResponse.data.organizations);
      
      // Fetch popular public organizations
      const publicOrgsResponse = await api.get('/organizations/popular');
      setPublicOrganizations(publicOrgsResponse.data.organizations);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to load organizations');
      setLoading(false);
    }
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleNewOrganization = () => {
    setOpenNewOrgDialog(true);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Organizations
        </Typography>
        
        {user && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleNewOrganization}
          >
            New Organization
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="organization tabs"
          >
            <Tab icon={<GroupIcon />} iconPosition="start" label="Your Organizations" />
            <Tab icon={<BusinessIcon />} iconPosition="start" label="Discover Organizations" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {organizations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                You are not a member of any organizations yet.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleNewOrganization}
                sx={{ mt: 2 }}
                startIcon={<AddIcon />}
              >
                Create an Organization
              </Button>
            </Box>
          ) : (
            <OrganizationGrid organizations={organizations} />
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {publicOrganizations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No public organizations found.
              </Typography>
            </Box>
          ) : (
            <OrganizationGrid organizations={publicOrganizations} />
          )}
        </TabPanel>
      </Paper>
      
      <NewOrganizationDialog 
        open={openNewOrgDialog}
        onClose={() => setOpenNewOrgDialog(false)}
        onOrganizationCreated={(newOrg) => {
          setOrganizations([newOrg, ...organizations]);
          setOpenNewOrgDialog(false);
        }}
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
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface OrganizationGridProps {
  organizations: Organization[];
}

const OrganizationGrid: React.FC<OrganizationGridProps> = ({ organizations }) => {
  const navigate = useNavigate();
  
  return (
    <Grid container spacing={3}>
      {organizations.map(org => (
        <Grid item xs={12} sm={6} md={4} key={org.id}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={org.logo_image ? `/api/images/${org.logo_image.id}` : undefined}
                  alt={org.name}
                  sx={{ width: 50, height: 50, mr: 2 }}
                >
                  {org.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" component="h2">
                    {org.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {org.repositories_count} repositories · {org.members_count} members
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                {org.description || 'No description provided'}
              </Typography>
              
              {org.is_admin && (
                <Typography variant="body2" color="primary">
                  You are an admin of this organization
                </Typography>
              )}
            </CardContent>
            
            <Divider />
            
            <CardActions>
              <Button 
                size="small" 
                fullWidth
                onClick={() => navigate(`/organizations/${org.name}`)}
              >
                View Organization
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

interface NewOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  onOrganizationCreated: (organization: Organization) => void;
}

const NewOrganizationDialog: React.FC<NewOrganizationDialogProps> = ({ open, onClose, onOrganizationCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: true
  });
  const [orgLogo, setOrgLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
      
      // Create organization
      const response = await api.post('/organizations', {
        name: formData.name,
        description: formData.description,
        is_public: formData.is_public
      });
      
      const newOrg = response.data.organization;
      
      // Upload logo if provided
      if (orgLogo) {
        const logoFormData = new FormData();
        logoFormData.append('logo', orgLogo);
        
        await api.post(`/organizations/${newOrg.id}/logo`, logoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      // Fetch the newly created organization with logo
      const createdOrgResponse = await api.get(`/organizations/${newOrg.id}`);
      
      onOrganizationCreated(createdOrgResponse.data.organization);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        is_public: true
      });
      setOrgLogo(null);
      setLogoPreview(null);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.response?.data?.message || 'Failed to create organization');
      setLoading(false);
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Create New Organization</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 2 }}>
          <Avatar
            src={logoPreview || undefined}
            sx={{ width: 80, height: 80, mr: 2 }}
          >
            {formData.name ? formData.name.charAt(0).toUpperCase() : <BusinessIcon />}
          </Avatar>
          
          <Button
            component="label"
            variant="outlined"
            size="small"
          >
            Upload Logo
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
            label="Make this organization public"
          />
          <Typography variant="caption" color="text.secondary">
            Public organizations are visible to all users. Private organizations are only visible to members.
          </Typography>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={loading || !formData.name}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          Create Organization
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Organizations; 