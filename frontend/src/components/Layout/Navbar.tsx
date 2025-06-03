import {
  AccountCircle,
  Menu as MenuIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProfileImageUrl } from '../../utils/imageUtils';

interface NavbarProps {
  onDrawerToggle?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onDrawerToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  return (
    <AppBar 
      position="relative"
      color="inherit" 
      elevation={0} 
      sx={{ 
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        minHeight: 64,
        width: '100%',
        zIndex: (theme) => theme.zIndex.drawer - 1
      }}
    >
      <Toolbar sx={{ 
        minHeight: 64, 
        height: '100%', 
        width: '100%', 
        px: 3,
        display: 'flex', 
        justifyContent: 'flex-end' 
      }}>
        {/* Left side: Menu icon only on mobile */}
        <Box sx={{ 
          display: { xs: 'flex', md: 'none' }, 
          alignItems: 'center',
          position: 'absolute',
          left: 16
        }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
        
        {/* Right side: user menu */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 2
        }}>
          {user ? (
            <>
              <IconButton color="inherit" size="large">
                <Badge badgeContent={notificationsCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                {user.profile_image_id ? (
                  <Avatar 
                    alt={user.username} 
                    src={getProfileImageUrl(user.profile_image_id)}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleProfile}>Profile</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button 
                component={Link} 
                to="/login" 
                variant="outlined" 
                sx={{ 
                  textTransform: 'none',
                  borderRadius: 2,
                  borderColor: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                  },
                }}
              >
                Sign In
              </Button>
              <Button 
                component={Link} 
                to="/register" 
                variant="contained" 
                sx={{ 
                  textTransform: 'none',
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 