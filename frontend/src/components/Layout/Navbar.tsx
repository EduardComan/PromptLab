import React, { useState } from 'react';
import { 
  AppBar, 
  Avatar, 
  Box, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Toolbar, 
  Tooltip, 
  Typography,
  Badge
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  RocketLaunch as RocketIcon, 
  AccountCircle, 
  Search as SearchIcon,
  Notifications as NotificationsIcon 
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import ThemeToggle from '../Common/ThemeToggle';

interface NavbarProps {
  drawerWidth: number;
  open: boolean;
  handleDrawerOpen: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ drawerWidth, open, handleDrawerOpen }) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { mode } = useThemeContext();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };
  
  const handleSearch = () => {
    navigate('/search');
  };
  
  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: mode === 'light' ? '#fff' : '#1e1e1e',
        color: mode === 'light' ? '#333' : '#fff',
        boxShadow: mode === 'light' 
          ? '0 2px 10px rgba(0,0,0,0.05)' 
          : '0 2px 10px rgba(0,0,0,0.2)',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerOpen}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        {/* Logo and App name */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <RocketIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            PromptLab
          </Typography>
        </Box>
        
        {/* Search button */}
        <Tooltip title="Search">
          <IconButton color="inherit" sx={{ ml: 1 }} onClick={handleSearch}>
            <SearchIcon />
          </IconButton>
        </Tooltip>
        
        {/* Theme toggle */}
        <ThemeToggle />
        
        <Box sx={{ flexGrow: 1 }} />
        
        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit" 
                sx={{ ml: 1 }}
                onClick={handleNotificationsOpen}
              >
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* Notifications menu */}
            <Menu
              anchorEl={notificationsAnchorEl}
              open={Boolean(notificationsAnchorEl)}
              onClose={handleNotificationsClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleNotificationsClose}>New comment on your prompt</MenuItem>
              <MenuItem onClick={handleNotificationsClose}>New follower</MenuItem>
              <MenuItem onClick={handleNotificationsClose}>System update</MenuItem>
            </Menu>
            
            {/* User profile menu */}
            <Tooltip title="Account settings">
              <IconButton
                edge="end"
                onClick={handleProfileMenuOpen}
                color="inherit"
                sx={{ ml: 1 }}
              >
                {user?.profile_image_id ? (
                  <Avatar
                    alt={user.username}
                    src={`/api/images/${user.profile_image_id}`}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box>
            <Button
              color="inherit"
              component={Link}
              to="/login"
              sx={{ mr: 1 }}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              component={Link}
              to="/register"
            >
              Sign Up
            </Button>
          </Box>
        )}
      </Toolbar>
      
      {/* User profile menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          component={Link} 
          to={`/users/${user?.username}`} 
          onClick={handleProfileMenuClose}
        >
          Profile
        </MenuItem>
        <MenuItem 
          component={Link} 
          to="/settings/profile" 
          onClick={handleProfileMenuClose}
        >
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Navbar; 