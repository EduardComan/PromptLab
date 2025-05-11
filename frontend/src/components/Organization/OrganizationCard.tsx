import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActionArea,
  Typography, 
  Avatar, 
  Box, 
  Chip,
  Stack,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import BusinessIcon from '@mui/icons-material/Business';
import GroupIcon from '@mui/icons-material/Group';
import CodeIcon from '@mui/icons-material/Code';
import StarIcon from '@mui/icons-material/Star';
import { Organization } from '../../interfaces';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 60,
  height: 60,
  backgroundColor: theme.palette.primary.main,
  marginRight: theme.spacing(2),
}));

interface OrganizationCardProps {
  organization: Organization;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({ organization }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/organizations/${organization.name}`);
  };

  return (
    <StyledCard>
      <CardActionArea onClick={handleClick} sx={{ height: '100%' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', mb: 2 }}>
            {organization.logo_image_id ? (
              <StyledAvatar 
                src={`/api/images/${organization.logo_image_id}`} 
                alt={organization.display_name}
              />
            ) : (
              <StyledAvatar>
                <BusinessIcon fontSize="large" />
              </StyledAvatar>
            )}
            <Box>
              <Typography variant="h6" component="div" noWrap>
                {organization.display_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                @{organization.name}
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ 
            mb: 2, 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            flexGrow: 1
          }}>
            {organization.description || 'No description provided'}
          </Typography>
          
          <Divider sx={{ my: 1 }} />
          
          <Stack 
            direction="row" 
            spacing={1} 
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 'auto' }}
          >
            <Chip
              size="small"
              icon={<GroupIcon fontSize="small" />}
              label={`${organization.member_count || 0} members`}
              variant="outlined"
            />
            <Chip
              size="small"
              icon={<CodeIcon fontSize="small" />}
              label={`${organization.repository_count || 0} repos`}
              variant="outlined"
            />
            <Chip
              size="small"
              icon={<StarIcon fontSize="small" />}
              label={`${organization.total_stars || 0} stars`}
              variant="outlined"
            />
          </Stack>
        </CardContent>
      </CardActionArea>
    </StyledCard>
  );
};

export default OrganizationCard; 