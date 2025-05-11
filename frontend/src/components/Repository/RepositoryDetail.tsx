import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Button, 
  Chip,
  Paper,
  Divider,
  Grid,
  IconButton,
  CircularProgress,
  Breadcrumbs
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  History as HistoryIcon,
  Code as CodeIcon,
  FourK as ForkIcon
} from '@mui/icons-material';
import { useParams, Link, useNavigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import PromptList from '../Prompt/PromptList';
import ConfirmDialog from '../Common/ConfirmDialog';
import RepositoryService from '../../services/RepositoryService';

interface Repository {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  owner_user: {
    id: string;
    username: string;
  } | null;
  owner_org: {
    id: string;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
  stars_count: number;
  forks_count: number;
  is_starred?: boolean;
}

interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  profile_image_id?: string;
  is_active: boolean;
  organizations?: { id: string; name: string }[];
}

const RepositoryDetail: React.FC = () => {
  const { repoId } = useParams<{ repoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isStarring, setIsStarring] = useState(false);
  
  useEffect(() => {
    const fetchRepository = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`/repositories/${repoId}`);
        setRepository(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch repository');
        console.error('Error fetching repository:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRepository();
  }, [repoId]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleStar = async () => {
    if (!repository || isStarring) return;
    
    setIsStarring(true);
    try {
      let updatedStars = 0;
      
      if (repository.is_starred) {
        const result = await RepositoryService.unstarRepository(repoId || '');
        updatedStars = result.stars;
        setRepository({
          ...repository,
          is_starred: false,
          stars_count: updatedStars
        });
      } else {
        const result = await RepositoryService.starRepository(repoId || '');
        updatedStars = result.stars;
        setRepository({
          ...repository,
          is_starred: true,
          stars_count: updatedStars
        });
      }
    } catch (err) {
      console.error('Error starring/unstarring repository:', err);
    } finally {
      setIsStarring(false);
    }
  };
  
  const handleFork = async () => {
    try {
      const response = await axios.post(`/repositories/${repoId}/fork`);
      navigate(`/repositories/${response.data.id}`);
    } catch (err) {
      console.error('Error forking repository:', err);
    }
  };
  
  const handleDelete = async () => {
    try {
      await axios.delete(`/repositories/${repoId}`);
      navigate('/repositories');
    } catch (err) {
      console.error('Error deleting repository:', err);
    }
  };
  
  const isOwner = () => {
    if (!user || !repository) return false;
    
    return (repository.owner_user && repository.owner_user.id === user.id);
  };
  
  const getRepoOwnerName = () => {
    if (!repository) return '';
    return repository.owner_user ? repository.owner_user.username : 
      repository.owner_org ? repository.owner_org.name : 'Unknown';
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !repository) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error">{error || 'Repository not found'}</Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/repositories">Repositories</Link>
        <Link to={`/user/${getRepoOwnerName()}`}>{getRepoOwnerName()}</Link>
        <Typography color="text.primary">{repository.name}</Typography>
      </Breadcrumbs>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {repository.is_public ? 
                <PublicIcon fontSize="small" sx={{ mr: 1 }} /> : 
                <LockIcon fontSize="small" sx={{ mr: 1 }} />}
              <Typography variant="h4" component="h1">
                {repository.name}
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {repository.description || 'No description provided'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={repository.is_starred ? <StarIcon /> : <StarBorderIcon />}
                onClick={handleStar}
                disabled={isStarring}
              >
                {repository.is_starred ? 'Starred' : 'Star'} ({repository.stars_count})
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ForkIcon />}
                onClick={handleFork}
              >
                Fork ({repository.forks_count})
              </Button>
              {isOwner() && (
                <>
                  <IconButton
                    size="small"
                    component={Link}
                    to={`/repositories/${repoId}/edit`}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item>
            <Typography variant="body2">
              Owner: <Link to={`/user/${getRepoOwnerName()}`}>{getRepoOwnerName()}</Link>
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2">
              Created: {format(new Date(repository.created_at), 'MMM dd, yyyy')}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2">
              Last updated: {format(new Date(repository.updated_at), 'MMM dd, yyyy')}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Prompts" icon={<CodeIcon />} iconPosition="start" />
          <Tab label="History" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        {tabValue === 0 && (
          <PromptList repoId={repoId || ''} isOwner={isOwner() || false} />
        )}
        {tabValue === 1 && (
          <Typography>Repository history will be shown here</Typography>
        )}
      </Box>
      
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Repository"
        content="Are you sure you want to delete this repository? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
};

export default RepositoryDetail; 