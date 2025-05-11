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
  Alert
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
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [ownerType, setOwnerType] = useState<'user' | 'organization'>(initialOrgId ? 'organization' : 'user');
  const [organizationId, setOrganizationId] = useState(initialOrgId || '');
  
  // Form validation and state
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgsLoading, setOrgsLoading] = useState(true);
  
  // Fetch organizations the user belongs to
  useEffect(() => {
    const fetchOrganizations = async () => {
      setOrgsLoading(true);
      try {
        const response = await api.get('/organizations/me');
        console.log('Organizations response:', response.data);
        
        // Extract organizations from the response
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
  
  // If in edit mode, fetch existing repository data
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
  
  const validateForm = () => {
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      setNameError('Repository name is required');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setNameError('Repository name can only contain letters, numbers, hyphens and underscores');
      isValid = false;
    } else {
      setNameError('');
    }
    
    // Validate organization selection if owner type is organization
    if (ownerType === 'organization' && !organizationId) {
      setError('Please select an organization');
      isValid = false;
    } else {
      setError(null);
    }
    
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (editMode && repositoryId) {
        // Update existing repository
        const updateData = {
          name,
          description,
          isPublic
        };
        
        console.log('Updating repository with data:', updateData);
        await RepositoryService.updateRepository(repositoryId, updateData);
        navigate(`/repositories/${repositoryId}`);
      } else {
        // Create new repository with default prompt
        const defaultPromptTitle = `${name}-Prompt`;
        
        const createData = {
          name,
          description,
          isPublic,
          ownerType,
          orgId: ownerType === 'organization' ? organizationId : undefined,
          default_prompt_title: defaultPromptTitle,
          default_prompt_content: '' // Empty content as requested
        };
        
        console.log('Creating repository with data:', createData);
        const result = await RepositoryService.createRepository(createData);
        console.log('Repository creation result:', result);
        
        // Navigate to the new repository - different APIs might return different structures
        if (result && result.repository && result.repository.id) {
          navigate(`/repositories/${result.repository.id}`);
        } else if (result && result.id) {
          navigate(`/repositories/${result.id}`);
        } else {
          throw new Error('Repository creation failed, no repository ID returned');
        }
      }
    } catch (err: any) {
      console.error('Error with repository:', err);
      
      // Handle different error responses
      if (err.response?.data?.errors) {
        // Validation errors
        const validationErrors = err.response.data.errors;
        if (validationErrors.name) {
          setNameError(validationErrors.name);
        }
        
        // Set general error message
        setError(err.response?.data?.message || 'Validation failed. Please check your inputs.');
      } else if (err.response?.data?.message) {
        // API returned error message
        setError(err.response.data.message);
      } else {
        // Generic error
        setError(err.message || 'Failed to process repository');
      }
      
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
      <Typography variant="h5" component="h1" gutterBottom>
        {editMode ? 'Edit Repository' : 'Create New Repository'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Owner
              </Typography>
              <RadioGroup
                row
                value={ownerType}
                onChange={(e) => {
                  setOwnerType(e.target.value as 'user' | 'organization');
                  // Reset organization ID if switching to user
                  if (e.target.value === 'user') {
                    setOrganizationId('');
                  }
                }}
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
                  disabled={orgsLoading || organizations.length === 0 || isSubmitting}
                />
              </RadioGroup>
              
              {ownerType === 'organization' && (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  {orgsLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">Loading your organizations...</Typography>
                    </Box>
                  ) : organizations.length > 0 ? (
                    <TextField
                      select
                      label="Select Organization"
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      required
                      disabled={isSubmitting}
                    >
                      {organizations.map((org) => (
                        <MenuItem key={org.id} value={org.id}>
                          {org.display_name || org.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <Alert severity="info">
                      You don't belong to any organizations. 
                      <Button 
                        component="a" 
                        href="/organizations/new" 
                        size="small" 
                        sx={{ ml: 1 }}
                      >
                        Create one
                      </Button>
                    </Alert>
                  )}
                </FormControl>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Repository Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!nameError}
              helperText={nameError || 'Use only letters, numbers, hyphens and underscores'}
              required
              disabled={editMode || isSubmitting}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              disabled={isSubmitting}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch 
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  color="primary"
                  disabled={isSubmitting}
                />
              }
              label="Public repository"
            />
            <FormHelperText>
              {isPublic 
                ? 'Everyone can see this repository, but only you and collaborators can make changes.' 
                : 'You choose who can see and contribute to this repository.'}
            </FormHelperText>
          </Grid>
          
          {!editMode && (
            <>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  A default prompt named "{name ? `${name}-Prompt` : 'Repository-Prompt'}" will be created automatically.
                </Alert>
              </Grid>
            </>
          )}
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
              >
                {isSubmitting ? (
                  <CircularProgress size={24} />
                ) : (
                  editMode ? 'Update Repository' : 'Create Repository'
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default NewRepositoryForm; 