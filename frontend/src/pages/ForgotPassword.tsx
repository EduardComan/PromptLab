import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  Alert, 
  CircularProgress, 
  styled, 
  Paper,
  Container
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { RocketLaunch as RocketIcon } from '@mui/icons-material';

// Styled components to match Login and Register pages
const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    backgroundColor: '#f7f9fc',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#aaa',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#000',
      borderWidth: '1px',
    },
    '& input': {
      color: '#000',
      fontWeight: 500,
    },
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, -9px) scale(0.75)',
    color: '#666',
  },
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  paddingTop: theme.spacing(5),
  paddingBottom: theme.spacing(5),
  paddingLeft: theme.spacing(4),
  paddingRight: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: 16,
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
  backgroundColor: '#fff',
  maxWidth: 450,
  width: '100%',
  margin: 'auto',
}));

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      // In a real application, you would call your API here
    }, 1500);
  };

  return (
    <Container maxWidth={false} sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f7',
      py: 4
    }}>
      <Box sx={{ 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mt: -4
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#000',
            textAlign: 'center',
            mb: 1
          }}
        >
          Forgot Password
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#666', 
            textAlign: 'center',
            maxWidth: 400,
            mb: 4
          }}
        >
          Enter your email address and we'll send you instructions to reset your password.
        </Typography>

        <StyledPaper>
          {success ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3, 
                  '& .MuiAlert-message': { fontWeight: 500 } 
                }}
              >
                Password reset instructions sent!
              </Alert>
              <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                Check your email for instructions on how to reset your password.
              </Typography>
              <Button 
                component={RouterLink} 
                to="/login" 
                variant="outlined" 
                sx={{ 
                  borderRadius: 2,
                  py: 1.2,
                  px: 4,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  borderColor: '#333',
                  color: '#333',
                  '&:hover': {
                    backgroundColor: '#f5f5f7',
                    borderColor: '#000',
                    color: '#000',
                  }
                }}
              >
                Return to Login
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3, 
                    '& .MuiAlert-message': { fontWeight: 500 } 
                  }}
                >
                  {error}
                </Alert>
              )}
              
              <StyledTextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 1,
                  mb: 3,
                  py: 1.2,
                  backgroundColor: '#333',
                  color: '#fff',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#000',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Send Reset Instructions'
                )}
              </Button>
              
              <Box sx={{ textAlign: 'center' }}>
                <Link 
                  component={RouterLink} 
                  to="/login" 
                  sx={{ 
                    color: '#666', 
                    textDecoration: 'none',
                    display: 'inline-block',
                    padding: '8px 12px',
                    borderRadius: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: '#000',
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  Return to Login
                </Link>
              </Box>
            </Box>
          )}
        </StyledPaper>
        
        {/* Bottom branding */}
        <Box sx={{ 
          mt: 4, 
          textAlign: 'center', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#666', 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            Powered by 
            <Typography 
              component="span" 
              variant="body1" 
              sx={{ 
                fontWeight: 600, 
                color: '#000',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <RocketIcon sx={{ fontSize: 14, mr: 0.5 }} />
              PromptLab
            </Typography>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default ForgotPassword; 