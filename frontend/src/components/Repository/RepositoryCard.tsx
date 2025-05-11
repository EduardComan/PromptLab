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

interface RepositoryCardProps {
  repository: Repository;
  onStar?: (id: string, isStarred: boolean) => void;
}

const RepositoryCard: React.FC<RepositoryCardProps> = React.memo(({ 
  repository,
  onStar
}) => {
  const { navigateToRepository } = useRepositoryNavigation();
  const isStarred = repository.isStarred || repository.is_starred;
  const ownerName = repository.owner_user ? repository.owner_user.username : repository.owner?.display_name;
  
  const ownerAvatar = repository.owner_user?.profile_image_id
    ? `/api/accounts/profile-image/${repository.owner_user.profile_image_id}`
    : repository.owner?.profile_image_id
      ? `/api/images/${repository.owner.profile_image_id}`
      : undefined;
      
  const ownerLink = repository.owner_user
    ? `/profile/${repository.owner_user.username}`
    : repository.owner
      ? `/organizations/${repository.owner.name}`
      : '#';
      
  const starCount = repository.stars_count !== undefined 
    ? repository.stars_count 
    : repository.star_count !== undefined
      ? repository.star_count
      : repository._count?.stars !== undefined
        ? repository._count.stars
        : repository.metrics?.stars !== undefined
          ? repository.metrics.stars
          : 0;

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onStar) {
      onStar(repository.id, Boolean(isStarred));
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
        borderRadius: 2,
        border: '1px solid #eaeaea',
        boxShadow: 'none',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
          cursor: 'pointer'
        }
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar 
            src={ownerAvatar}
            alt={ownerName || ''}
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            {ownerName ? ownerName[0].toUpperCase() : <PersonIcon />}
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
                {ownerName || ''}
              </Typography>
              
              {repository.prompt?.id && (
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