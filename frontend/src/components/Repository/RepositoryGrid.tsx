import React, { useState, useCallback } from 'react';
import {
  Grid,
  Typography,
  Box,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import RepositoryCard from './RepositoryCard';

export interface Repository {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  owner_user?: {
    id: string;
    username: string;
    profile_image?: {
      id: string;
    };
  };
  owner_org?: {
    id: string;
    name: string;
    logo_image?: {
      id: string;
    };
  };
  created_at: string;
  updated_at?: string;
  stars_count?: number;
  _count?: {
    stars?: number;
  };
  isStarred?: boolean;
  prompt?: {
    id: string;
    title: string;
    description: string | null;
  };
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

interface RepositoryGridProps {
  repositories: Repository[];
  title?: string;
  emptyMessage?: string;
  loading?: boolean;
  onStar?: (id: string, isStarred: boolean) => Promise<void>;
  hideCreateButton?: boolean;
}

const RepositoryGrid: React.FC<RepositoryGridProps> = ({
  repositories,
  title,
  emptyMessage = "No repositories found",
  loading = false,
  onStar,
  hideCreateButton = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingStars, setLoadingStars] = useState<Record<string, boolean>>({});
  
  const handleCreateRepo = useCallback(() => {
    navigate('/repositories/new');
  }, [navigate]);

  const handleStarToggle = useCallback(async (repoId: string, isStarred: boolean) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      setLoadingStars(prev => ({ ...prev, [repoId]: true }));
      
      if (isStarred) {
        await api.delete(`/repositories/${repoId}/star`);
      } else {
        await api.post(`/repositories/${repoId}/star`);
      }
      
      // Call onStar callback for parent components to refresh data
      if (onStar) {
        await onStar(repoId, isStarred);
      }
    } catch (err) {
      console.error('Error toggling star:', err);
    } finally {
      setLoadingStars(prev => ({ ...prev, [repoId]: false }));
    }
  }, [user, navigate, onStar]);
  
  const renderCreateButton = () => (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={handleCreateRepo}
      sx={{
        background: 'linear-gradient(45deg, #4568dc, #b06ab3)',
        boxShadow: '0 4px 12px rgba(176, 106, 179, 0.2)',
        '&:hover': {
          background: 'linear-gradient(45deg, #3457cb, #9f59a2)',
          boxShadow: '0 6px 16px rgba(176, 106, 179, 0.3)',
        }
      }}
    >
      New Repository
    </Button>
  );
  
  return (
    <Box>
      {title && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {user && !hideCreateButton && renderCreateButton()}
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : repositories.length > 0 ? (
        <Grid container spacing={3}>
          {repositories.map((repository) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={repository.id}>
              <RepositoryCard 
                repository={repository} 
                onStar={handleStarToggle}
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
            {emptyMessage}
          </Typography>
          {user && !hideCreateButton && renderCreateButton()}
        </Box>
      )}
    </Box>
  );
};

export default RepositoryGrid; 