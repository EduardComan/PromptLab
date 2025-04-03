import React from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

// Sidebar width 
const DRAWER_WIDTH = 240;

const AppLayout: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  
  const handleDrawerClose = () => {
    setOpen(false);
  };
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Top navigation bar */}
      <Navbar drawerWidth={DRAWER_WIDTH} open={open} handleDrawerOpen={handleDrawerOpen} />
      
      {/* Sidebar navigation */}
      <Sidebar drawerWidth={DRAWER_WIDTH} open={open} handleDrawerClose={handleDrawerClose} />
      
      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          minHeight: '100vh',
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        <Toolbar /> {/* Empty toolbar to push content below app bar */}
        <Outlet /> {/* Render the nested routes */}
      </Box>
    </Box>
  );
};

export default AppLayout; 