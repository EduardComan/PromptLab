import React from 'react';
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
  Button
} from '@mui/material';
import {
  Star as StarIcon,
  Visibility as VisibilityIcon,
  Bookmark as BookmarkIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

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
  
  if (repositories.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Grid container spacing={3}>
      {repositories.map((repo) => (
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
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  src={
                    repo.owner_user?.profile_image 
                      ? `/api/images/${repo.owner_user.profile_image.id}` 
                      : repo.owner_org?.logo_image 
                      ? `/api/images/${repo.owner_org.logo_image.id}`
                      : undefined
                  }
                  sx={{ width: 24, height: 24, mr: 1 }}
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
              
              <Typography 
                variant="h6" 
                component="h2" 
                gutterBottom 
                noWrap
                onClick={() => navigate(`/repositories/${repo.id}`)}
                sx={{ cursor: 'pointer' }}
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
                        navigate(`/tags/${tag.name}`);
                      }}
                    />
                  ))}
                  {repo.tags.length > 3 && (
                    <Chip
                      label={`+${repo.tags.length - 3}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <StarIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5, mr: 2 }}>
                  {repo.stars_count}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {repo.is_public ? (
                    <VisibilityIcon fontSize="small" color="action" />
                  ) : (
                    <BookmarkIcon fontSize="small" color="action" />
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    {repo.is_public ? 'Public' : 'Private'}
                  </Typography>
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  {formatDistanceToNow(new Date(repo.created_at), { addSuffix: true })}
                </Typography>
              </Box>
            </CardContent>
            
            <Divider />
            
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate(`/repositories/${repo.id}`)}
                sx={{ width: '100%' }}
              >
                View Prompt
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default RepositoryGrid; 