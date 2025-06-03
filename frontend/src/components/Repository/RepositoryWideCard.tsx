import React, { useCallback, useState, useEffect } from 'react';
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
  CalendarToday as CalendarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { Repository } from '../../interfaces';
import { useRepositoryNavigation } from '../../hooks/useRepositoryNavigation';
import api from '../../services/api';
import { getProfileImageUrl, getImageUrl } from '../../utils/imageUtils';

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
  const { navigateToRepository } = useRepositoryNavigation();
  const [orgName, setOrgName] = useState<string>('');
  
  useEffect(() => {
    const fetchOrgName = async () => {
      if (repository.owner_org_id && repository.owner_org) {
        try {
          const res = await api.get(`/organizations/${repository.owner_org_id}`);
          if (res.data && res.data.organization) {
            setOrgName(res.data.organization.display_name || res.data.organization.name || 'Unknown');
          }
        } catch (error) {
          console.error('Error fetching organization:', error);
          setOrgName('Unknown');
        }
      }
    };
    
    fetchOrgName();
  }, [repository.owner_org_id, repository.owner_org]);
  
  // Prioritize organization ownership over user ownership
  const ownerName = repository.owner_org_id && repository.owner_org 
    ? repository.owner_org.display_name || repository.owner_org.name || orgName || 'Unknown'
    : repository.owner_user?.username || 'Unknown';
  
  const ownerLink = repository.owner_org_id && repository.owner_org
    ? `/organizations/${repository.owner_org_id}` 
    : repository.owner_user 
      ? `/profile/${repository.owner_user.username}` 
      : '#';
  
  const starCount = repository.stats?.stars !== undefined ? repository.stats.stars : 0;
  const isStarred = repository.stats?.is_starred === true;
  
  const handleStar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onStar) {
      onStar(repository.id, isStarred);
    }
  }, [repository.id, isStarred, onStar]);

  const handleCardClick = (e: React.MouseEvent) => {
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
        },
        width: '100%',
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Title and Description */}
        <Box>
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
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {repository.name}
          </Typography>
        </Box>
        
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
              src={repository.owner_org_id && repository.owner_org?.logo_image?.id 
                ? getImageUrl(repository.owner_org.logo_image.id)
                : !repository.owner_org_id && repository.owner_user?.profile_image?.id 
                ? getProfileImageUrl(repository.owner_user.profile_image.id)
                : !repository.owner_org_id && profileImage
                ? profileImage
                : undefined
              }
              alt={ownerName || ''}
              sx={{ width: 40, height: 40, mr: 2 }}
            >
              {ownerName ? ownerName[0].toUpperCase() : <PersonIcon />}
            </Avatar>
            <Typography 
              variant="body2" 
              component={Link}
              to={ownerLink}
              onClick={(e) => e.stopPropagation()}
              sx={{ 
                mr: 2,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': { 
                  textDecoration: 'underline',
                  color: 'primary.main'
                }
              }}
            >
              {ownerName}
            </Typography>
            
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
                  <Tooltip title={isStarred ? "Unstar repository" : "Star repository"}>
                    <IconButton 
                      size="small" 
                      onClick={handleStar}
                      sx={{ 
                        color: isStarred ? '#f1c40f' : 'text.secondary',
                        '&:hover': { color: '#f1c40f' }
                      }}
                      aria-label={isStarred ? "Unstar repository" : "Star repository"}
                    >
                      {isStarred ? <StarIcon fontSize="small" /> : <StarOutlineIcon fontSize="small" />}
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