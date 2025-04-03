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
  FormHelperText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
}

interface NewRepositoryFormProps {
  editMode?: boolean;
  repositoryId?: string;
}

const NewRepositoryForm: React.FC<NewRepositoryFormProps> = ({ editMode = false, repositoryId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [ownerType, setOwnerType] = useState('user');
  const [organizationId, setOrganizationId] = useState('');
  
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(editMode);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch organizations the user belongs to
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await axios.get('/organizations');
        setOrganizations(response.data.organizations);
      } catch (err) {
        console.error('Error fetching organizations:', err);
      }
    };
    
    fetchOrganizations();
  }, []);
  
  // If in edit mode, fetch existing repository data
  useEffect(() => {
    if (editMode && repositoryId) {
      const fetchRepository = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`/repositories/${repositoryId}`);
          const repo = response.data;
          
          setName(repo.name);
          setDescription(repo.description || '');
          setIsPublic(repo.is_public);
          
          if (repo.owner_org) {
            setOwnerType('organization');
            setOrganizationId(repo.owner_org.id);
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
      isValid = false;
    }
    
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        name,
        description: description || null,
        is_public: isPublic,
        owner_type: ownerType,
        owner_id: ownerType === 'organization' ? organizationId : undefined
      };
      
      let response;
      
      if (editMode && repositoryId) {
        response = await axios.put(`/repositories/${repositoryId}`, payload);
      } else {
        response = await axios.post('/repositories', payload);
      }
      
      navigate(`/repositories/${response.data.id}`);
    } catch (err: any) {
      console.error('Error creating repository:', err);
      
      if (err.response?.data?.errors?.name) {
        setNameError(err.response.data.errors.name);
      } else {
        setError(err.response?.data?.message || 'Failed to create repository');
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
      <Typography variant="h5" component="h1" gutterBottom>
        {editMode ? 'Edit Repository' : 'Create New Repository'}
      </Typography>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
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
                onChange={(e) => setOwnerType(e.target.value)}
              >
                <FormControlLabel 
                  value="user" 
                  control={<Radio />} 
                  label={`Personal (${user?.username})`} 
                />
                <FormControlLabel 
                  value="organization" 
                  control={<Radio />} 
                  label="Organization" 
                  disabled={organizations.length === 0}
                />
              </RadioGroup>
              
              {ownerType === 'organization' && (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <TextField
                    select
                    label="Select Organization"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    required
                  >
                    {organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.name}
                      </MenuItem>
                    ))}
                  </TextField>
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
              disabled={editMode && !isLoading}
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
              placeholder="Provide a short description of this repository"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  color="primary"
                />
              }
              label="Public repository"
            />
            <FormHelperText>
              {isPublic 
                ? 'Anyone can see this repository. You choose who can contribute.' 
                : 'You choose who can see and contribute to this repository.'}
            </FormHelperText>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
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