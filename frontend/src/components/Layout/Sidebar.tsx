import {
  BusinessOutlined as BusinessIcon,
  ChevronLeft as ChevronLeftIcon,
  Add as CreateIcon,
  ElectricBolt,
  Explore as ExploreIcon,
  Home as HomeIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// Styled components
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  minHeight: 64, // Same height as app bar
  backgroundColor: theme.palette.background.default,
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
}));

const Logo = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  fontWeight: 700,
  fontSize: '1.25rem',
  letterSpacing: '.1rem',
}));

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

interface Organization {
  id: string;
  name: string;
  display_name?: string;
  logo_image_id?: string;
}

interface SidebarProps {
  open?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open: propOpen, onToggle }) => {
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [localOpen, setLocalOpen] = React.useState(!isMobile);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  // Use either prop-controlled or local state
  const open = propOpen !== undefined ? propOpen : localOpen;
  
  // Toggle drawer
  const toggleDrawer = () => {
    if (onToggle) {
      onToggle();
    } else {
      setLocalOpen(!localOpen);
    }
  };

  // Fetch user's organizations
  useEffect(() => {
    if (user) {
      const fetchOrganizations = async () => {
        try {
          const response = await api.get('/organizations/me');
          setOrganizations(response.data.organizations || []);
        } catch (err) {
          console.error('Error fetching organizations:', err);
          setOrganizations([]);
        }
      };
      
      fetchOrganizations();
    }
  }, [user]);
  
  const drawerWidth = open ? 240 : 64;
  
  // Menu items for the sidebar
  const menuItems: MenuItem[] = [
    { 
      title: 'Home', 
      path: '/dashboard', 
      icon: <HomeIcon /> 
    },
    { 
      title: 'Discover', 
      path: '/discover', 
      icon: <ExploreIcon /> 
    }
  ];
  
  // Menu items that only appear when user is logged in - with reversed order
  const authenticatedMenuItems: MenuItem[] = [
    { 
      title: 'Organizations', 
      path: '/organizations', 
      icon: <BusinessIcon /> 
    },
    { 
      title: 'Create Repository', 
      path: '/repositories/new', 
      icon: <CreateIcon /> 
    }
  ];

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={open}
      onClose={isMobile ? toggleDrawer : undefined}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        position: 'absolute',
        height: '100%',
        '& .MuiBackdrop-root': {
          display: 'none',
        },
        '& .MuiDrawer-paper': { 
          position: 'absolute',
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <DrawerHeader>
        {open && (
          <Logo>
            <ElectricBolt sx={{ fontSize: 20, mr: 1 }} />
            PromptLab
          </Logo>
        )}
        <IconButton onClick={toggleDrawer}>
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.title} 
              component={NavLink} 
              to={item.path}
              sx={{
                mb: 0.5,
                px: 2,
                py: 1,
                justifyContent: open ? 'initial' : 'center',
                color: 'text.primary',
                borderRadius: '0 20px 20px 0',
                '&.active': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  color: 'primary.main',
                  fontWeight: 'bold',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                }
              }}
            >
              <Tooltip title={open ? "" : item.title} placement="right">
                <ListItemIcon sx={{ minWidth: open ? 40 : 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
              </Tooltip>
              {open && <ListItemText primary={item.title} />}
            </ListItem>
          ))}
        </List>
        
        {user && (
          <>
            <Divider sx={{ my: 2 }} />
            {open && (
              <Typography variant="subtitle2" color="text.secondary" sx={{ px: 3, mb: 1 }}>
                Personal
              </Typography>
            )}
            <List>
              {authenticatedMenuItems.map((item) => (
                <ListItem 
                  button 
                  key={item.title} 
                  component={NavLink} 
                  to={item.path}
                  sx={{
                    mb: 0.5,
                    px: 2,
                    py: 1,
                    justifyContent: open ? 'initial' : 'center',
                    color: 'text.primary',
                    borderRadius: '0 20px 20px 0',
                    '&.active': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      color: 'primary.main',
                      fontWeight: 'bold',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <Tooltip title={open ? "" : item.title} placement="right">
                    <ListItemIcon sx={{ minWidth: open ? 40 : 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>
                      {item.icon}
                    </ListItemIcon>
                  </Tooltip>
                  {open && <ListItemText primary={item.title} />}
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar; 