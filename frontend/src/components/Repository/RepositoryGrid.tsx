import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Avatar,
  Divider,
  Chip,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as VisibilityIcon,
  LockOutlined as LockIcon,
  PersonOutline as PersonIcon,
  BusinessOutlined as BusinessIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface Repository {
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
  stars_count: number;
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
  emptyMessage?: string;
}

const RepositoryGrid: React.FC<RepositoryGridProps> = ({ 
  repositories, 
  emptyMessage = 'No repositories found.' 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [starredRepos, setStarredRepos] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  
  if (repositories.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  const handleStarToggle = async (event: React.MouseEvent, repoId: string, isStarred: boolean) => {
    event.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, [repoId]: true }));
      
      if (isStarred) {
        await api.delete(`/repositories/${repoId}/unstar`);
      } else {
        await api.post(`/repositories/${repoId}/star`);
      }
      
      setStarredRepos(prev => ({ ...prev, [repoId]: !isStarred }));
      
      // Update the star count in the UI by finding and modifying the repository
      const repoIndex = repositories.findIndex(repo => repo.id === repoId);
      if (repoIndex !== -1) {
        repositories[repoIndex].stars_count += isStarred ? -1 : 1;
      }
      
    } catch (err) {
      console.error('Error toggling star:', err);
    } finally {
      setLoading(prev => ({ ...prev, [repoId]: false }));
    }
  };
  
  return (
    <Grid container spacing={3}>
      {repositories.map((repo) => {
        // Check if repo is starred by looking at local state or initial count
        const isStarred = starredRepos[repo.id] !== undefined 
          ? starredRepos[repo.id] 
          : false;
        
        return (
          <Grid item xs={12} sm={6} md={4} key={repo.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Card header with owner info */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  p: 2,
                  pb: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    src={
                      repo.owner_user?.profile_image 
                        ? `/api/images/${repo.owner_user.profile_image.id}` 
                        : repo.owner_org?.logo_image 
                        ? `/api/images/${repo.owner_org.logo_image.id}`
                        : undefined
                    }
                    sx={{ width: 26, height: 26, mr: 1 }}
                    onClick={() => {
                      if (repo.owner_user) {
                        navigate(`/users/${repo.owner_user.username}`);
                      } else if (repo.owner_org) {
                        navigate(`/orgs/${repo.owner_org.name}`);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {repo.owner_user 
                      ? repo.owner_user.username.charAt(0).toUpperCase() 
                      : repo.owner_org?.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {repo.owner_org ? 
                      <BusinessIcon fontSize="small" sx={{ mr: 0.5, fontSize: 14, color: 'text.secondary' }} /> : 
                      <PersonIcon fontSize="small" sx={{ mr: 0.5, fontSize: 14, color: 'text.secondary' }} />
                    }
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      onClick={() => {
                        if (repo.owner_user) {
                          navigate(`/users/${repo.owner_user.username}`);
                        } else if (repo.owner_org) {
                          navigate(`/orgs/${repo.owner_org.name}`);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {repo.owner_user?.username || repo.owner_org?.name}
                    </Typography>
                  </Box>
                </Box>
                
                <Tooltip title={repo.is_public ? "Public repository" : "Private repository"}>
                  <Box>
                    {repo.is_public ? (
                      <VisibilityIcon fontSize="small" color="action" />
                    ) : (
                      <LockIcon fontSize="small" color="action" />
                    )}
                  </Box>
                </Tooltip>
              </Box>
              
              <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                <Typography 
                  variant="h6" 
                  component="h2" 
                  gutterBottom 
                  noWrap
                  onClick={() => navigate(`/repositories/${repo.id}`)}
                  sx={{ cursor: 'pointer', fontWeight: '500' }}
                >
                  {repo.name}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2, 
                    height: 40, 
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {repo.description || repo.prompt?.description || 'No description available'}
                </Typography>
                
                {repo.tags && repo.tags.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {repo.tags.slice(0, 3).map((tag) => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/search?tag=${tag.name}`);
                        }}
                        sx={{ 
                          borderRadius: '4px', 
                          height: '22px',
                          fontSize: '0.75rem'
                        }}
                      />
                    ))}
                    {repo.tags.length > 3 && (
                      <Chip
                        label={`+${repo.tags.length - 3}`}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderRadius: '4px', 
                          height: '22px',
                          fontSize: '0.75rem'
                        }}
                      />
                    )}
                  </Box>
                )}
              </CardContent>
              
              <Divider />
              
              <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title={isStarred ? "Unstar this repository" : "Star this repository"}>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleStarToggle(e, repo.id, isStarred)}
                      disabled={loading[repo.id]}
                      sx={{ 
                        mr: 1,
                        color: isStarred ? 'warning.main' : 'action.active'
                      }}
                    >
                      {isStarred ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  </Tooltip>
                  <Typography variant="body2" color="text.secondary">
                    {repo.stars_count}
                  </Typography>
                </Box>
                
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(repo.created_at), { addSuffix: true })}
                </Typography>
                
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => navigate(`/repositories/${repo.id}`)}
                  sx={{ ml: 'auto' }}
                >
                  View
                </Button>
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default RepositoryGrid; 