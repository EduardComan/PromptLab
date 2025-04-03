import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Typography, Paper, Grid, Tab, Tabs, CircularProgress, Alert } from '@mui/material';
import PromptPerformance from '../analytics/PromptPerformance';

// Mock data for prompt details
interface PromptDetails {
  id: string;
  title: string;
  description: string;
  repositoryName: string;
  owner: string;
  totalRuns: number;
  lastRunAt: string;
  averageResponseTime: number;
}

// TabPanel component for tab content
const TabPanel: React.FC<{
  children?: React.ReactNode;
  index: number;
  value: number;
}> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const PromptAnalytics: React.FC = () => {
  const { promptId } = useParams<{ promptId: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promptDetails, setPromptDetails] = useState<PromptDetails | null>(null);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Fetch prompt details
  useEffect(() => {
    const fetchPromptDetails = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be an API call
        // const response = await api.get(`/api/prompts/${promptId}`);
        
        // Simulate API response with mock data
        setTimeout(() => {
          const mockDetails: PromptDetails = {
            id: promptId || 'prompt-123',
            title: 'Product Description Generator',
            description: 'Generates compelling product descriptions for e-commerce listings',
            repositoryName: 'E-commerce Prompts',
            owner: 'marketing-team',
            totalRuns: 256,
            lastRunAt: new Date().toISOString(),
            averageResponseTime: 890,
          };
          
          setPromptDetails(mockDetails);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load prompt details');
        setLoading(false);
      }
    };

    if (promptId) {
      fetchPromptDetails();
    }
  }, [promptId]);

  // Show loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show error state
  if (error || !promptDetails) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Prompt not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {promptDetails.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {promptDetails.description}
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Repository</Typography>
              <Typography variant="body1">{promptDetails.repositoryName}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Owner</Typography>
              <Typography variant="body1">{promptDetails.owner}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Total Runs</Typography>
              <Typography variant="body1">{promptDetails.totalRuns}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">Avg Response Time</Typography>
              <Typography variant="body1">{promptDetails.averageResponseTime}ms</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="prompt analytics tabs">
          <Tab label="Performance" id="analytics-tab-0" />
          <Tab label="Usage" id="analytics-tab-1" />
          <Tab label="Versions" id="analytics-tab-2" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <PromptPerformance promptId={promptDetails.id} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Usage Statistics</Typography>
          <Typography variant="body1">
            This section will show usage patterns, user distribution, and frequency of execution.
          </Typography>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Version Performance Comparison</Typography>
          <Typography variant="body1">
            This section will compare performance metrics across different versions of the prompt.
          </Typography>
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default PromptAnalytics; 