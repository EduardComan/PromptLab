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
  Public as PublicIcon,
  Lock as LockIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { Repository } from '../../interfaces';

interface RepositoryWideCardProps {
  repository: Repository;
  onStar?: (id: string, isStarred: boolean) => void;
  profileImage?: string;
}

const RepositoryWideCard: React.FC<RepositoryWideCardProps> = React.memo(({ 
  repository,
  onStar,
  profileImage
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
  
  const ownerAvatar = profileImage || 
    (repository.owner_user?.profile_image?.id
      ? `/api/accounts/profile-image/${repository.owner_user.profile_image.id}`
      : repository.owner_org?.logo_image?.id
        ? `/api/images/${repository.owner_org.logo_image.id}`
        : undefined);
  
  // Calculate star count from available properties
  const starCount = repository.stars_count || 
    (repository._count && repository._count.stars) || 
    0;
  
  const handleStar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onStar) {
      onStar(repository.id, !!repository.isStarred);
    }
  }, [repository.id, repository.isStarred, onStar]);

  return (
    <Card sx={{ 
      height: '100%',
      borderRadius: 2,
      border: '1px solid #eaeaea',
      boxShadow: 'none',
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
      },
      width: '100%',
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Title and Description */}
        <Link 
          to={`/repositories/${repository.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              mb: 1.5,
              color: 'text.primary',
              '&:hover': { color: 'primary.main' },
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {repository.name}
          </Typography>
        </Link>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2.5,
            fontSize: '0.95rem',
            lineHeight: 1.5,
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}
        >
          {repository.description || 'No description provided'}
        </Typography>
        
        {/* Tags */}
        {repository.tags && repository.tags.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            mb: 2.5,
            maxWidth: '100%',
            overflow: 'hidden',
          }}>
            {repository.tags.map(tag => (
              <Chip 
                key={tag.id} 
                label={tag.name} 
                size="small" 
                variant="outlined"
                sx={{ 
                  borderRadius: '16px',
                  maxWidth: '100%',
                }}
              />
            ))}
          </Box>
        )}
        
        {/* Footer - metadata */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          rowGap: 2,
          width: '100%',
        }}>
          {/* User Info */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            minWidth: 0,
            maxWidth: '70%',
          }}>
            <Avatar 
              sx={{ width: 28, height: 28, mr: 1, flexShrink: 0 }}
              alt={ownerName}
              src={ownerAvatar}
            >
              {ownerName ? ownerName[0].toUpperCase() : 'U'}
            </Avatar>
            <Typography 
              variant="body2" 
              component="span" 
              sx={{ 
                mr: 2,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {ownerName}
            </Typography>
            
            {/* Visibility Badge */}
            <Chip 
              icon={repository.is_public ? <PublicIcon fontSize="small" /> : <LockIcon fontSize="small" />}
              size="small"
              label={repository.is_public ? "Public" : "Private"}
              color={repository.is_public ? "success" : "default"}
              variant="outlined"
              sx={{ 
                height: 24,
                borderRadius: 3,
                fontSize: '0.75rem',
                flexShrink: 0,
              }}
            />
          </Box>
          
          {/* Right side metadata */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
            color: 'text.secondary',
            fontSize: '0.875rem',
            flexShrink: 0,
          }}>
            {/* Star count */}
            {repository.is_public && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 0.5
              }}>
                {user && (
                  <Tooltip title={repository.isStarred ? "Unstar repository" : "Star repository"}>
                    <IconButton 
                      size="small" 
                      onClick={handleStar}
                      sx={{ 
                        color: repository.isStarred ? '#f1c40f' : 'text.secondary',
                        '&:hover': { color: '#f1c40f' }
                      }}
                      aria-label={repository.isStarred ? "Unstar repository" : "Star repository"}
                    >
                      {repository.isStarred ? <StarIcon fontSize="small" /> : <StarOutlineIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: starCount > 0 ? 600 : 400
                  }}
                >
                  {starCount}
                </Typography>
              </Box>
            )}
            
            {/* Creation date */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {formatDistanceToNow(new Date(repository.created_at), { addSuffix: true })}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

RepositoryWideCard.displayName = 'RepositoryWideCard';

export default RepositoryWideCard; 