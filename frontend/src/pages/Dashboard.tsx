import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Paper, 
  Tabs, 
  Tab, 
  Alert,
  Button
} from '@mui/material';
import { 
  Code as CodeIcon, 
  Star as StarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import RepositoryGrid, { Repository } from '../components/Repository/RepositoryGrid';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// This file exists to resolve the import in App.tsx
// The Home component contains the dashboard functionality
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myRepositories, setMyRepositories] = useState<Repository[]>([]);
  const [starredRepositories, setStarredRepositories] = useState<Repository[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRepositories = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user's own repositories
      const reposResponse = await api.get(`/repositories/user/${user.username}`);
      setMyRepositories(reposResponse.data.repositories || []);
      
      // Fetch starred repositories
      const starredResponse = await api.get(`/accounts/user/${user.username}/starred`);
      setStarredRepositories(starredResponse.data.repositories || []);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      setError('Failed to load your repositories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserRepositories();
    } else {
      setLoading(false);
    }
  }, [user, fetchUserRepositories]);

  const handleStarRepo = useCallback(async (repoId: string, isStarred: boolean): Promise<void> => {
    try {
      // Update UI immediately for better user experience
      const updateRepositories = (repos: Repository[]) => 
        repos.map(repo => 
          repo.id === repoId 
            ? { 
                ...repo, 
                isStarred: !isStarred,
                stars_count: (repo.stars_count || 0) + (isStarred ? -1 : 1) 
              } 
            : repo
        );
      
      setMyRepositories(prev => updateRepositories(prev));
      setStarredRepositories(prev => {
        if (isStarred) {
          // Remove from starred list if unstarred
          return prev.filter(repo => repo.id !== repoId);
        } else {
          // Add to starred list if starred
          const repoExists = prev.some(repo => repo.id === repoId);
          if (repoExists) {
            return updateRepositories(prev);
          } else {
            // Add the newly starred repo to the starred list
            const repoToAdd = myRepositories.find(repo => repo.id === repoId);
            if (repoToAdd) {
              return [...prev, { 
                ...repoToAdd, 
                isStarred: true,
                stars_count: (repoToAdd.stars_count || 0) + 1 
              }];
            }
            return prev;
          }
        }
      });
      
      // Call the appropriate service method
      if (isStarred) {
        await api.delete(`/repositories/${repoId}/star`);
      } else {
        await api.post(`/repositories/${repoId}/star`);
      }
      
      // Refresh data to ensure consistency
      await fetchUserRepositories();
    } catch (error) {
      console.error('Error starring repository:', error);
      setError('Failed to star repository. Please try again.');
      
      // Refresh in case of error
      await fetchUserRepositories();
    }
  }, [fetchUserRepositories, myRepositories]);

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchUserRepositories();
  }, [fetchUserRepositories]);

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ pt: 4, pb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            My Dashboard
          </Typography>
          <Alert severity="info">
            Please log in to view your dashboard and repositories.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 4, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            My Dashboard
          </Typography>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={handleRefresh}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your repositories and see your starred content
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}
        
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{ mb: 3 }}
          >
            <Tab 
              icon={<CodeIcon fontSize="small" />} 
              iconPosition="start" 
              label="My Repositories" 
            />
            <Tab 
              icon={<StarIcon fontSize="small" />} 
              iconPosition="start" 
              label="Starred" 
            />
          </Tabs>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box role="tabpanel" hidden={tabValue !== 0}>
                {tabValue === 0 && (
                  <RepositoryGrid 
                    repositories={myRepositories}
                    onStar={handleStarRepo}
                    emptyMessage="You haven't created any repositories yet."
                  />
                )}
              </Box>
              <Box role="tabpanel" hidden={tabValue !== 1}>
                {tabValue === 1 && (
                  <RepositoryGrid 
                    repositories={starredRepositories}
                    onStar={handleStarRepo}
                    emptyMessage="You haven't starred any repositories yet."
                  />
                )}
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard; 