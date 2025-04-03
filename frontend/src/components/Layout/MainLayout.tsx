import React, { useState } from 'react';
import { Box, Toolbar, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const drawerWidth = 240;

const MainLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  
  const handleDrawerClose = () => {
    setOpen(false);
  };
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      <Navbar 
        drawerWidth={drawerWidth} 
        open={open} 
        handleDrawerOpen={handleDrawerOpen} 
      />
      
      <Sidebar 
        drawerWidth={drawerWidth} 
        open={open} 
        handleDrawerClose={handleDrawerClose} 
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` }
        }}
      >
        <Toolbar /> {/* This creates space for the fixed navbar */}
        <Outlet /> {/* This renders the current route's element */}
      </Box>
    </Box>
  );
};

export default MainLayout; 