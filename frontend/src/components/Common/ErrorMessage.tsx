import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <Paper 
      elevation={3}
      sx={{ 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        backgroundColor: 'error.light',
        color: 'error.contrastText'
      }}
    >
      <ErrorIcon sx={{ fontSize: 48, mb: 2, color: 'error.main' }} />
      <Typography variant="h6" gutterBottom align="center">
        An error occurred
      </Typography>
      <Typography variant="body1" align="center" sx={{ mb: onRetry ? 3 : 0 }}>
        {message}
      </Typography>
      {onRetry && (
        <Button 
          variant="contained" 
          onClick={onRetry}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      )}
    </Paper>
  );
};

export default ErrorMessage; 