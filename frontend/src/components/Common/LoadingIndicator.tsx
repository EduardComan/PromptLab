import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingIndicatorProps {
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message = 'Loading...' }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        p: 4
      }}
    >
      <CircularProgress size={40} />
      {message && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingIndicator; 