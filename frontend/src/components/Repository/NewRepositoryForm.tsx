import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Switch,
  Button,
  MenuItem,
  CircularProgress,
  Paper,
  Grid,
  Divider,
  FormHelperText,
  Alert,
  Select,
  SelectChangeEvent,
  InputLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import RepositoryService from '../../services/RepositoryService';
import api from '../../services/api';

interface Organization {
  id: string;
  name: string;
  display_name: string;
  role?: string;
  description?: string;
  logo_image_id?: string;
}

interface NewRepositoryFormProps {
  editMode?: boolean;
  repositoryId?: string;
  initialOrgId?: string;
}

const NewRepositoryForm: React.FC<NewRepositoryFormProps> = ({ 
  editMode = false, 
  repositoryId,
  initialOrgId
}) => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [ownerType, setOwnerType] = useState<'user' | 'organization'>(initialOrgId ? 'organization' : 'user');
  const [organizationId, setOrganizationId] = useState(initialOrgId || '');
  
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  
  // Fetch organizations the user belongs to
  useEffect(() => {
    const fetchOrganizations = async () => {
      setOrgsLoading(true);
      try {
        const response = await api.get('/organizations/me');
        console.log('Organizations response:', response.data);
        
        const orgs = response.data.organizations || [];
        setOrganizations(orgs);
        
        // If initialOrgId is provided, set it as selected
        if (initialOrgId && orgs.length > 0) {
          const org = orgs.find((org: Organization) => org.id === initialOrgId);
          if (org) {
            setOrganizationId(org.id);
            setOwnerType('organization');
          }
        }
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError('Failed to load your organizations. You can still create a personal repository.');
      } finally {
        setOrgsLoading(false);
      }
    };
    
    fetchOrganizations();
  }, [initialOrgId]);
  
  useEffect(() => {
    if (editMode && repositoryId) {
      const fetchRepository = async () => {
        setIsLoading(true);
        try {
          const repo = await RepositoryService.getRepositoryById(repositoryId);
          
          setName(repo.name);
          setDescription(repo.description || '');
          setIsPublic(repo.is_public);
          
          if (repo.owner_org_id) {
            setOwnerType('organization');
            setOrganizationId(repo.owner_org_id);
          } else {
            setOwnerType('user');
          }
          
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to fetch repository');
          console.error('Error fetching repository:', err);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchRepository();
    }
  }, [editMode, repositoryId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'name') {
      setName(value);
      // Clear validation error when user types
      if (validationErrors.name) {
        setValidationErrors(prev => ({
          ...prev,
          name: ''
        }));
      }
    } else if (name === 'description') {
      setDescription(value);
      // Clear validation error when user types
      if (validationErrors.description) {
        setValidationErrors(prev => ({
          ...prev,
          description: ''
        }));
      }
    } else if (name === 'isPublic') {
      setIsPublic(checked);
    }
  };
  
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      errors.name = 'Repository name is required';
      isValid = false;
    } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      errors.name = 'Repository name can contain hyphens and underscores';
      isValid = false;
    }
    
    // Validate organization selection if owner type is organization
    if (ownerType === 'organization' && !organizationId) {
      errors.organizationId = 'Please select an organization';
      isValid = false;
    }
    
    setValidationErrors(errors);
    setError(null);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!validateForm()) return;
  
    setIsSubmitting(true);
    setError(null);
  
    try {
      if (editMode && repositoryId) {
        const updateData = {
          name,
          description,
          isPublic
        };
  
        await RepositoryService.updateRepository(repositoryId, updateData);
        setSuccess(true);
  
        setTimeout(() => navigate(`/repositories/${repositoryId}`), 1000);
      } else {
        const createData = {
          name,
          description,
          isPublic,
          ownerType,
          orgId: ownerType === 'organization' ? organizationId : undefined,
          default_prompt_title: `${name}-prompt`,
          default_prompt_content: ''
        };
  
        const result = await RepositoryService.createRepository(createData);
        setSuccess(true);
        navigate('/dashboard');
  
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
        
      }
    } catch (err: any) {
      console.error('Error during submit:', err);
      const res = err.response?.data;
  
      if (res?.errors) {
        const formatted: { [key: string]: string } = {};
        Object.keys(res.errors).forEach(k => (formatted[k] = res.errors[k]));
        setValidationErrors(formatted);
        setError('Validation failed. Please check your inputs.');
      } else if (res?.message) {
        setError(res.message);
      } else {
        setError(err.message || 'Unknown error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom sx={{mb:2}}>
        {editMode ? 'Edit Repository' : 'New Repository Details'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Repository {editMode ? 'updated' : 'created'} successfully! Redirecting...
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <Typography variant="subtitle1" gutterBottom>
                Owner
              </Typography>
              <RadioGroup
                aria-label="repository-owner"
                name="ownerType"
                value={ownerType}
                onChange={(e) => setOwnerType(e.target.value as 'user' | 'organization')}
                row
              >
                <FormControlLabel
                  value="user"
                  control={<Radio />}
                  label={`Personal`}
                  disabled={isSubmitting}
                />
                <FormControlLabel
                  value="organization"
                  control={<Radio />}
                  label="Organization"
                  disabled={isSubmitting || organizations.length === 0}
                />
              </RadioGroup>
              {ownerType === 'organization' && (
                <FormControl fullWidth error={!!validationErrors.organizationId} sx={{ mt: 2 }}>
                  <InputLabel id="org-select-label">Select Organization</InputLabel>
                  <Select
                    labelId="org-select-label"
                    id="org-select"
                    value={organizationId}
                    onChange={(e: SelectChangeEvent) => {
                      setOrganizationId(e.target.value);
                      if (validationErrors.organizationId) {
                        setValidationErrors(prev => ({
                          ...prev,
                          organizationId: ''
                        }));
                      }
                    }}
                    label="Select Organization"
                    disabled={isSubmitting || orgsLoading}
                  >
                    {organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.display_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {validationErrors.organizationId && (
                    <FormHelperText>{validationErrors.organizationId}</FormHelperText>
                  )}
                </FormControl>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ mb: 1 }} />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Repository Name"
              name="name"
              value={name}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!validationErrors.name}
              helperText={validationErrors.name || "Letters, numbers, hyphens and underscores only"}
              disabled={isSubmitting}
              placeholder="my-repository"
              inputProps={{
                pattern: "[a-zA-Z0-9\\-]+",
                title: "Hyphen separeted only e.g. my-repo-name"
              }}                          
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Description"
              name="description"
              value={description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              error={!!validationErrors.description}
              helperText={validationErrors.description || "Briefly describe your repository"}
              disabled={isSubmitting}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  name="isPublic"
                  color="primary"
                  disabled={isSubmitting}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">
                    {isPublic ? 'Public' : 'Private'} Repository
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isPublic 
                      ? 'Anyone can see this repository. You choose who can contribute.' 
                      : 'You choose who can see and contribute to this repository.'}
                  </Typography>
                </Box>
              }
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
                sx={{
                  background: 'linear-gradient(45deg, #4568dc, #b06ab3)',
                  boxShadow: '0 4px 12px rgba(176, 106, 179, 0.2)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #3457cb, #9f59a2)',
                    boxShadow: '0 6px 16px rgba(176, 106, 179, 0.3)',
                  }
                }}
              >
                {isSubmitting ? 'Processing...' : editMode ? 'Update Repository' : 'Create Repository'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default NewRepositoryForm; 