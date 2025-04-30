import React, { useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Avatar, 
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  StarOutline as StarOutlineIcon,
  Star as StarIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { Repository } from './RepositoryGrid';

interface RepositoryCardProps {
  repository: Repository;
  onStar?: (id: string, isStarred: boolean) => void;
}

const RepositoryCard: React.FC<RepositoryCardProps> = React.memo(({ 
  repository,
  onStar
}) => {
  const { user } = useAuth();
  
  const ownerName = repository.owner_user 
    ? repository.owner_user.username 
    : repository.owner_org?.name || 'Unknown';
  
  const ownerLink = repository.owner_user 
    ? `/profile/${repository.owner_user.username}` 
    : repository.owner_org 
      ? `/organizations/${repository.owner_org.name}` 
      : '#';
  
  const ownerAvatar = repository.owner_user?.profile_image?.id
    ? `/api/accounts/profile-image/${repository.owner_user.profile_image.id}`
    : repository.owner_org?.logo_image?.id
      ? `/api/images/${repository.owner_org.logo_image.id}`
      : undefined;
  
  // Handle date formatting safely
  const repoUpdateTime = repository.updated_at 
    ? formatDistanceToNow(new Date(repository.updated_at), { addSuffix: true })
    : formatDistanceToNow(new Date(repository.created_at), { addSuffix: true });
  
  // Calculate star count from either direct property or _count
  const starCount = repository.stars_count || repository._count?.stars || 0;
  
  const handleStar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onStar) {
      onStar(repository.id, !!repository.isStarred);
    }
  }, [repository.id, repository.isStarred, onStar]);

  return (
    <Card 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        }
      }}
      component={Link}
      to={`/repositories/${repository.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={ownerAvatar} 
            alt={ownerName}
            sx={{ width: 28, height: 28, mr: 1 }}
          >
            {ownerName ? ownerName[0].toUpperCase() : 'U'}
          </Avatar>
          <Typography 
            variant="body2" 
            component={Link} 
            to={ownerLink} 
            onClick={(e) => e.stopPropagation()}
            sx={{ 
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            {ownerName}
          </Typography>
        </Box>
        <Box>
          {!repository.is_public && (
            <Tooltip title="Private repository">
              <Chip 
                label="Private" 
                size="small" 
                sx={{ 
                  height: '20px', 
                  fontSize: '0.7rem',
                  backgroundColor: 'rgba(0,0,0,0.08)', 
                  mr: 1 
                }} 
              /> 
            </Tooltip>
          )}
        </Box>
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CodeIcon sx={{ fontSize: 18, color: 'primary.main', mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {repository.name}
          </Typography>
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2, 
            mt: 1, 
            height: '40px', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical' 
          }}
        >
          {repository.description || "No description provided"}
        </Typography>
      </CardContent>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pt: 0 }}>
        <Typography variant="caption" color="text.secondary">
          Last updated {repoUpdateTime}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={repository.isStarred ? "Unstar" : "Star"}>
            <IconButton 
              size="small" 
              onClick={handleStar}
              sx={{ 
                color: repository.isStarred ? 'primary.main' : 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
              aria-label={repository.isStarred ? "Unstar repository" : "Star repository"}
            >
              {repository.isStarred ? <StarIcon fontSize="small" /> : <StarOutlineIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            {starCount}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
});

RepositoryCard.displayName = 'RepositoryCard';

export default RepositoryCard; 