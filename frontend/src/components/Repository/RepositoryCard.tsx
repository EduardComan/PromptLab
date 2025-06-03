import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Avatar, 
  IconButton,
  Chip
} from '@mui/material';
import { 
  StarOutline as StarOutlineIcon,
  Star as StarIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Repository } from '../../interfaces';
import { useRepositoryNavigation } from '../../hooks/useRepositoryNavigation';
import { getProfileImageUrl, getImageUrl } from '../../utils/imageUtils';

interface RepositoryCardProps {
  repository: Repository;
  onStar?: (id: string, isStarred: boolean) => void;
}

const RepositoryCard: React.FC<RepositoryCardProps> = React.memo(({ 
  repository,
  onStar
}) => {
  const { navigateToRepository } = useRepositoryNavigation();
  
  // Get star status - use stats.is_starred for consistency
  const isStarred = repository.stats?.is_starred === true;
  
  // Get star count - use stats.stars for consistency
  const starCount = repository.stats?.stars !== undefined ? repository.stats.stars : 0;
  
  // Prioritize organization ownership over user ownership
  const ownerName = repository.owner_org?.name 
    || repository.owner_user?.username 
    || repository.owner?.username 
    || repository.owner?.display_name;
  
  const ownerLink = repository.owner_org_id && repository.owner_org
    ? `/organizations/${repository.owner_org.id}`
    : repository.owner_user
      ? `/profile/${repository.owner_user.username}`
      : repository.owner
        ? `/organizations/${repository.owner.id}`
        : '#';

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onStar) {
      onStar(repository.id, isStarred);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigateToRepository(repository);
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar 
            src={repository.owner_org_id && repository.owner_org?.logo_image?.id 
              ? getImageUrl(repository.owner_org.logo_image.id)
              : !repository.owner_org_id && repository.owner_user?.profile_image?.id 
              ? getProfileImageUrl(repository.owner_user.profile_image.id)
              : !repository.owner_org_id && repository.owner?.profile_image?.id 
              ? getProfileImageUrl(repository.owner.profile_image.id)
              : undefined
            }
            alt={repository.owner_org?.name || repository.owner_user?.username || repository.owner?.username}
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            {(repository.owner_org?.name || repository.owner_user?.username || repository.owner?.username || 'U')[0].toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6"
              sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {repository.name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                component={Link}
                to={ownerLink}
                onClick={(e) => e.stopPropagation()}
                sx={{ 
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                @{ownerName || ''}
              </Typography>
              
              {repository.latest_prompt?.id && (
                <Chip
                  label="Prompt"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                />
              )}
            </Box>
          </Box>
          
          {onStar && (
            <IconButton 
              onClick={handleStarClick}
              size="small"
              color="primary"
              aria-label={isStarred ? "Unstar repository" : "Star repository"}
            >
              {isStarred ? (
                <StarIcon fontSize="small" sx={{ color: '#f1c40f' }} />
              ) : (
                <StarOutlineIcon fontSize="small" />
              )}
            </IconButton>
          )}
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {repository.description || 'No description provided'}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StarIcon fontSize="small" sx={{ color: '#f1c40f', mr: 0.5 }} />
            <Typography variant="body2">
              {starCount}
            </Typography>
          </Box>
          {repository.created_at && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {formatDistanceToNow(new Date(repository.created_at), { addSuffix: true })}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

export default RepositoryCard;