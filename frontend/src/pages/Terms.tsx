import React from 'react';
import { 
  Container, 
  Typography, 
  Paper,
  Button,
  Box
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { RocketLaunch as RocketIcon } from '@mui/icons-material';

const Terms: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: 3,
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.06)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', mb: 2 }}>
            <RocketIcon sx={{ color: '#000', fontSize: 32, mr: 1.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
              PromptLab
            </Typography>
          </Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Terms & Conditions
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            The legally binding stuff, but fun!
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 600 }}>
        1. No Skynet Allowed
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          You agree not to use our AI prompts to create sentient machines bent on world domination. 
          That's just rude.
        </Typography>

        <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 600 }}>
          2. Prompt Responsibility
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Don't blame us if your AI prompt asking for "the perfect pizza recipe" somehow creates 
          instructions for building a rocket instead. Results may vary.
        </Typography>

        <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 600 }}>
          3. Account Security
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please use a better password than "password123". We believe in you.
        </Typography>

        <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 600 }}>
          4. Content Ownership
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Your prompts are yours. Our servers are ours.
        </Typography>

        <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 600 }}>
          5. Legal Stuff
        </Typography>
        <Typography variant="body1" sx={{ mb: 5 }}>
          By using PromptLab, you agree to our terms. If you violate them, we may ask you very 
          politely to stop. If you continue, we'll be very disappointed in you.
        </Typography>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button 
            component={RouterLink} 
            to="/register" 
            variant="contained" 
            size="large"
            sx={{ 
              px: 4, 
              py: 1.2, 
              borderRadius: 2,
              boxShadow: 'none',
              backgroundColor: '#333',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#000',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            Back to Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Terms; 