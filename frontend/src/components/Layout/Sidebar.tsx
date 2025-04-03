import React from 'react';
import { 
  Drawer, 
  List, 
  Divider, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  IconButton, 
  Box, 
  useTheme,
  useMediaQuery,
  Button
} from '@mui/material';
import { 
  ChevronLeft as ChevronLeftIcon,
  Home as HomeIcon,
  Bookmarks as BookmarksIcon,
  Groups as GroupsIcon,
  Star as StarIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  drawerWidth: number;
  open: boolean;
  handleDrawerClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ drawerWidth, open, handleDrawerClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Search', icon: <SearchIcon />, path: '/search' }
  ];
  
  const authenticatedMenuItems = [
    { text: 'My Repositories', icon: <BookmarksIcon />, path: `/users/${user?.username}` },
    { text: 'Organizations', icon: <GroupsIcon />, path: '/organizations' },
    { text: 'Starred', icon: <StarIcon />, path: '/starred' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings/profile' }
  ];
  
  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      handleDrawerClose();
    }
  };
  
  const isCurrentPath = (path: string) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };
  
  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? open : true}
      onClose={handleDrawerClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff' 
        },
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {isMobile && (
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      
      <Divider />
      
      <Box sx={{ px: 2, py: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => handleNavigate('/repositories/new')}
          sx={{ 
            py: 1,
            fontWeight: 500,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          New Repository
        </Button>
      </Box>
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              onClick={() => handleNavigate(item.path)}
              selected={isCurrentPath(item.path)}
              sx={{
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(144, 202, 249, 0.16)' 
                    : 'rgba(33, 150, 243, 0.08)',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(144, 202, 249, 0.24)' 
                      : 'rgba(33, 150, 243, 0.12)',
                  }
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {isAuthenticated && (
        <>
          <Divider sx={{ my: 1 }} />
          <List>
            {authenticatedMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  onClick={() => handleNavigate(item.path)}
                  selected={isCurrentPath(item.path)}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(144, 202, 249, 0.16)' 
                        : 'rgba(33, 150, 243, 0.08)',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(144, 202, 249, 0.24)' 
                          : 'rgba(33, 150, 243, 0.12)',
                      }
                    }
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Drawer>
  );
};

export default Sidebar; 