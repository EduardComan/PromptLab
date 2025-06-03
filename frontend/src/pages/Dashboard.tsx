import {
  Code as CodeIcon,
  Star as StarIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import RepositoryWideCard from '../components/Repository/RepositoryWideCard';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import RepositoryService from '../services/RepositoryService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

function EmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ py: 5, textAlign: 'center' }}>
      <Typography variant="body1" color="text.secondary">{message}</Typography>
    </Box>
  );
}

// This file exists to resolve the import in App.tsx
// The Home component contains the dashboard functionality
const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myRepositories, setMyRepositories] = useState<any[]>([]);
  const [starredRepositories, setStarredRepositories] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchUserRepositories = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user's own repositories
      const reposResponse = await api.get(`/repositories/user/${user.username}`);
      const userRepos = reposResponse.data.repositories || [];
      
      // Fetch starred repos
      try {
        const starredResponse = await api.get(`/accounts/me/starred`);
        const starredRepos = starredResponse.data.repositories || [];
        
        // Update starred status in user repositories
        const starredRepoIds = new Set(starredRepos.map((repo: any) => repo.id));
        const userReposWithStarredStatus = userRepos.map((repo: any) => ({
          ...repo,
          stats: {
            ...repo.stats,
            is_starred: starredRepoIds.has(repo.id)
          }
        }));
        
        setMyRepositories(userReposWithStarredStatus);
        
        // For starred repos, make sure they have is_starred=true
        const formattedStarredRepos = starredRepos.map((repo: any) => ({
          ...repo,
          stats: {
            ...repo.stats,
            is_starred: true
          }
        }));
        
        setStarredRepositories(formattedStarredRepos);
      } catch (starredErr) {
        console.error('Error fetching starred repositories:', starredErr);
        // Don't fail the whole function if just starred repos fail
        setMyRepositories(userRepos);
        setStarredRepositories([]);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
      setError('Failed to load your repositories. Please try again.');
      setMyRepositories([]);
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

  const handleStarToggle = async (repoId: string, isStarred: boolean) => {
    try {
      if (!isAuthenticated) {
        return;
      }

      // Update optimistically
      const updateRepositoryStar = (repo: any) => {
        if (repo.id === repoId) {
          // Calculate new star count
          const currentStars = repo.stats?.stars || 0;
          const newStarCount = isStarred ? Math.max(0, currentStars - 1) : currentStars + 1;
          
          return {
            ...repo,
            stats: {
              ...repo.stats,
              stars: newStarCount,
              is_starred: !isStarred
            }
          };
        }
        return repo;
      };

      // Update repo in "My Repositories" tab
      setMyRepositories(prevRepos => prevRepos.map(updateRepositoryStar));
      
      // For starred repos tab, we need special handling
      if (isStarred) {
        // Remove from starred tab if unstarring
        setStarredRepositories(prevRepos => prevRepos.filter(repo => repo.id !== repoId));
      } else {
        // Add to starred tab if starring
        const repoToAdd = myRepositories.find(repo => repo.id === repoId);
        if (repoToAdd) {
          const updatedRepo = updateRepositoryStar(repoToAdd);
          setStarredRepositories(prevRepos => [updatedRepo, ...prevRepos]);
        }
      }

      // Make the API call
      if (isStarred) {
        await RepositoryService.unstarRepository(repoId);
      } else {
        await RepositoryService.starRepository(repoId);
      }

      setSnackbar({ 
        open: true, 
        message: isStarred ? 'Repository unstarred' : 'Repository starred', 
        severity: 'success' 
      });
      
      // Refresh from server after API call to ensure consistent state
      await fetchUserRepositories();
    } catch (err) {
      console.error(err);
      setSnackbar({ 
        open: true, 
        message: 'Error updating star', 
        severity: 'error' 
      });
      // Refresh from server on error to ensure consistent state
      fetchUserRepositories();
    }
  };

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

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
              label={`My Repositories ${myRepositories.length || 0}`} 
            />
            <Tab 
              icon={<StarIcon fontSize="small" />} 
              iconPosition="start" 
              label={`Starred ${starredRepositories.length || 0}`} 
            />
          </Tabs>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TabPanel value={tabValue} index={0}>
                {myRepositories.length > 0 ? (
                  <Grid container spacing={3}>
                    {myRepositories.map(repo => (
                      <Grid item xs={12} key={repo.id}>
                        <RepositoryWideCard
                          repository={repo}
                          onStar={handleStarToggle}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <EmptyState message="You haven't created any repositories yet." />
                )}
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                {starredRepositories.length > 0 ? (
                  <Grid container spacing={3}>
                    {starredRepositories.map(repo => (
                      <Grid item xs={12} key={repo.id}>
                        <RepositoryWideCard
                          repository={repo}
                          onStar={handleStarToggle}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <EmptyState message="You haven't starred any repositories yet." />
                )}
              </TabPanel>
            </>
          )}
        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default Dashboard; 