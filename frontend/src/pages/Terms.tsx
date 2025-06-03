import {
  Copyright as CopyrightIcon,
  ElectricBolt,
  SentimentSatisfiedAlt as SatisfiedIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography
} from '@mui/material';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const Terms: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 3, md: 5 }, 
          borderRadius: 3,
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.06)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', mb: 2 }}>
            <ElectricBolt sx={{ color: '#000', fontSize: 40, mr: 1.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#000' }}>
              PromptLab
            </Typography>
          </Box>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 800, mb: 2 }}>
            Terms & Conditions
          </Typography>
          
          <Chip 
            label="Last Updated: March 2025" 
            color="primary" 
            variant="outlined" 
            sx={{ mt: 2 }} 
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            Welcome to PromptLab! These terms and conditions outline the rules and regulations for using our platform.
          </Typography>
        </Box>
        
        <List sx={{ mb: 4 }}>
          <ListItem alignItems="flex-start" sx={{ mb: 3, pb: 2 }}>
            <ListItemIcon>
              <SecurityIcon color="primary" fontSize="large" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Responsible AI Use
                </Typography>
              }
              secondary={
                <Typography component="span" variant="body1" color="text.primary">
                  We encourage creative prompt engineering, but please use our platform responsibly.
                  Avoid creating prompts that could generate harmful content."
                </Typography>
              }
            />
          </ListItem>

          <ListItem alignItems="flex-start" sx={{ mb: 3, pb: 2 }}>
            <ListItemIcon>
              <CopyrightIcon color="primary" fontSize="large" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Content Ownership
                </Typography>
              }
              secondary={
                <Typography component="span" variant="body1" color="text.primary">
                  You own the prompts you create. We don't claim any ownership over your brilliant ideas.
                  However, by posting publicly, you're allowing others to see and learn from your work - think
                  of it as contributing to the collective prompt engineering knowledge pool. Sharing is caring!
                </Typography>
              }
            />
          </ListItem>

          <ListItem alignItems="flex-start" sx={{ mb: 3, pb: 2 }}>
            <ListItemIcon>
              <VerifiedIcon color="primary" fontSize="large" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Account Security
                </Typography>
              }
              secondary={
                <Typography component="span" variant="body1" color="text.primary">
                  Please use a strong password. We suggest a mix of uppercase, lowercase, numbers, and symbols.
                  "Password123" just doesn't cut it these days. Think of your password as the bouncer to your
                  private prompt collection - make it tough enough to keep the troublemakers out!
                </Typography>
              }
            />
          </ListItem>

          <ListItem alignItems="flex-start">
            <ListItemIcon>
              <SatisfiedIcon color="primary" fontSize="large" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  The Fun Clause
                </Typography>
              }
              secondary={
                <Typography component="span" variant="body1" color="text.primary">
                  We believe AI should be fun and accessible. By using PromptLab, you agree to 
                  occasionally smile while using our platform. This clause is not legally binding, 
                  but we'd appreciate your compliance nonetheless.
                </Typography>
              }
            />
          </ListItem>
        </List>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 5 }}>
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
            Back to Register
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Terms; 