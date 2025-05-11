import React from 'react';
import { 
  Card, 
  CardContent,
  Typography, 
  Avatar, 
  Box
} from '@mui/material';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import BusinessIcon from '@mui/icons-material/Business';
import GroupIcon from '@mui/icons-material/Group';
import CodeIcon from '@mui/icons-material/Code';
import CalendarToday from '@mui/icons-material/CalendarToday';
import { Organization } from '../../interfaces';

interface OrganizationCardProps {
  organization: Organization;
  withLink?: boolean;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({ 
  organization, 
  withLink = true 
}) => {
  const LinkComponent = withLink ? Link : 'div';

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
          boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar 
            src={organization.logo_image_id ? `/api/images/${organization.logo_image_id}` : undefined}
            alt={organization.display_name || organization.name || ''}
            sx={{ width: 50, height: 50, mr: 2, bgcolor: 'primary.main' }}
          >
            {organization.display_name?.[0]?.toUpperCase() || organization.name?.[0]?.toUpperCase() || <BusinessIcon />}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              component={LinkComponent}
              to={withLink ? `/organizations/${organization.name}` : undefined}
              sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover': withLink ? { color: 'primary.main' } : {},
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {organization.display_name || organization.name}
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
            >
              @{organization.name}
            </Typography>
          </Box>
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mb: 3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '40px'
          }}
        >
          {organization.description || 'No description provided'}
        </Typography>
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: 2 
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {organization.member_count || 0} members
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CodeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {organization.repository_count || 0} repos
            </Typography>
          </Box>
        </Box>
        
        {organization.created_at && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <CalendarToday fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {formatDistanceToNow(new Date(organization.created_at), { addSuffix: true })}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationCard; 