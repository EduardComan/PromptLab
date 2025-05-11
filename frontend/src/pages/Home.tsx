import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Tab,
  Tabs,
  CircularProgress,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Snackbar,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Sync as RecentIcon,
  Person as PersonIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import RepositoryGrid from '../components/Repository/RepositoryGrid';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useCardStyle } from '../hooks/useCardStyle';
import RepositoryService from '../services/RepositoryService';

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [trendingRepos, setTrendingRepos] = useState<any[]>([]);
  const [recentRepos, setRecentRepos] = useState<any[]>([]);
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Use the card style hook with wide cards as default for home page
  const { cardStyle } = useCardStyle('wide');

  const fetchRepos = useCallback(async () => {
    setLoading(true);
    try {
      // First get user starred repositories if user is logged in to determine starred state
      let starredIds = new Set<string>();
      
      if (user) {
        try {
          const starredResponse = await api.get('/accounts/me/starred');
          const starredRepos = starredResponse.data.repositories || [];
          // Create a set of starred repo IDs for quick lookup
          starredIds = new Set(starredRepos.map((repo: any) => repo.id));
        } catch (error) {
          console.error('Error fetching starred repositories:', error);
        }
      }
      
      // Fetch trending repositories by star count
      const trendingResponse = await api.get('/repositories', {
        params: { limit: 8, sort: 'stars', order: 'desc' }
      });

      // Fetch recent repositories
      const recentResponse = await api.get('/repositories', {
        params: { limit: 8, sort: 'created_at', order: 'desc' }
      });
      
      // Process repositories properly
      const processRepos = (repos: any[]) => repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        is_public: repo.is_public,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        stars_count: repo.stars_count || 0,
        owner_user: repo.owner_user,
        owner_org: repo.owner_org,
        isStarred: starredIds.has(repo.id), // Mark as starred if in starred set
        tags: repo.tags
      }));

      setTrendingRepos(processRepos(trendingResponse.data.repositories || []));
      setRecentRepos(processRepos(recentResponse.data.repositories || []));

      // If user is logged in, fetch their repositories
      if (user) {
        // Get user repositories
        const userReposResponse = await api.get(`/repositories/user/${user.username}`, {
          params: { limit: 4 }
        });
        
        // Mark user repositories as starred if they are in starredIds
        const userReposWithStarred = processRepos(userReposResponse.data.repositories || []);
        setUserRepos(userReposWithStarred);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const handleStarRepo = async (repoId: string, isStarred: boolean) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      let updatedStars = 0;
      
      if (isStarred) {
        const result = await RepositoryService.unstarRepository(repoId);
        updatedStars = result.stars;
        
        // Update local state immediately with accurate star count from backend
        const updateReposList = (repos: any[]) => 
          repos.map(repo => 
            repo.id === repoId 
              ? { ...repo, isStarred: false, stars_count: updatedStars } 
              : repo
          );
        
        setTrendingRepos(prev => updateReposList(prev));
        setRecentRepos(prev => updateReposList(prev));
        setUserRepos(prev => updateReposList(prev));
        
        setSnackbar({
          open: true,
          message: 'Repository unstarred',
          severity: 'success'
        });
      } else {
        const result = await RepositoryService.starRepository(repoId);
        updatedStars = result.stars;
        
        // Update local state immediately with accurate star count from backend
        const updateReposList = (repos: any[]) => 
          repos.map(repo => 
            repo.id === repoId 
              ? { ...repo, isStarred: true, stars_count: updatedStars } 
              : repo
          );
        
        setTrendingRepos(prev => updateReposList(prev));
        setRecentRepos(prev => updateReposList(prev));
        setUserRepos(prev => updateReposList(prev));
        
        setSnackbar({
          open: true,
          message: 'Repository starred',
          severity: 'success'
        });
      }
      
      // No need to call fetchRepos() after every star/unstar operation
      // This avoids flickering and provides a better user experience
      // If there's an error, we'll refresh data
    } catch (error) {
      console.error('Error starring repository:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update starred status. Please try again.',
        severity: 'error'
      });
      
      // Only if there was an error, refresh the repos to ensure correct state
      fetchRepos();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box
        sx={{
          pt: 4,
          pb: 6,
          mb: 6,
          position: 'relative',
          backgroundImage: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',
          backgroundSize: 'cover',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Container maxWidth="md">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  mb: 2
                }}
              >
                PromptLab
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 400,
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  mb: 3
                }}
              >
                Discover, share, and collaborate on AI prompts
              </Typography>
              <Box component="form" onSubmit={handleSearch} sx={{ mb: 4 }}>
                <TextField
                  fullWidth
                  placeholder="Search for prompts, tags, or users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <Button
                        type="submit"
                        variant="contained"
                        sx={{
                          background: 'rgba(0,0,0,0.25)',
                          '&:hover': {
                            background: 'rgba(0,0,0,0.35)'
                          }
                        }}
                      >
                        Search
                      </Button>
                    ),
                    sx: {
                      bgcolor: 'white',
                      borderRadius: 2,
                      pr: 0.5
                    }
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <img
                src="/hero-image.png"
                alt="AI Prompts"
                style={{
                  width: '100%',
                  height: 'auto',
                  filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))'
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Repository Section */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 2,
          backgroundImage: 'linear-gradient(to right, #f5f7fa, #c3cfe2)',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="repository tabs"
            centered
          >
            <Tab 
              icon={<TrendingIcon />} 
              iconPosition="start" 
              label="Trending" 
              id="tab-0" 
              aria-controls="tabpanel-0" 
            />
            <Tab 
              icon={<RecentIcon />} 
              iconPosition="start" 
              label="Recent" 
              id="tab-1" 
              aria-controls="tabpanel-1" 
            />
            {user && (
              <Tab 
                icon={<PersonIcon />} 
                iconPosition="start" 
                label="Your Repositories" 
                id="tab-2" 
                aria-controls="tabpanel-2" 
              />
            )}
          </Tabs>
        </Box>

        {/* Trending Repositories Section */}
        <Box sx={{ mt: 6, mb: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingIcon sx={{ mr: 1 }} />
              Trending Repositories
            </Typography>
            <Button
              component={Link}
              to="/discover"
              variant="outlined"
              size="small"
            >
              View All
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <RepositoryGrid 
              repositories={trendingRepos}
              emptyMessage="No trending repositories found."
              loading={loading}
              onStar={handleStarRepo}
              hideCreateButton={true}
              itemsPerPage={4} // Set 4 items per page
            />
          )}
        </Box>
        
        {/* Recent Repositories Section */}
        <Box sx={{ mt: 6, mb: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
              <RecentIcon sx={{ mr: 1 }} />
              Recent Repositories
            </Typography>
            <Button
              component={Link}
              to="/discover"
              variant="outlined"
              size="small"
            >
              View All
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <RepositoryGrid 
              repositories={recentRepos}
              emptyMessage="No recent repositories found."
              loading={loading}
              onStar={handleStarRepo}
              hideCreateButton={true}
              itemsPerPage={4} // Set 4 items per page
            />
          )}
        </Box>
        
        {/* Your Repositories Section (only show if user is logged in) */}
        {user && (
          <Box sx={{ mt: 6, mb: 8 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Your Repositories
              </Typography>
              <Button
                component={Link}
                to={`/profile/${user.username}`}
                variant="outlined"
                size="small"
              >
                View All
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <RepositoryGrid 
                repositories={userRepos}
                emptyMessage="You don't have any repositories yet."
                loading={loading}
                onStar={handleStarRepo}
                itemsPerPage={4} // Set 4 items per page
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Call to Action Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          borderRadius: 2, 
          textAlign: 'center',
          backgroundImage: 'linear-gradient(to top, #a8edea 0%, #fed6e3 100%)',
          mb: 6
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
          Ready to create your own prompts?
        </Typography>
        <Typography variant="body1" paragraph>
          Create a repository and start crafting powerful AI prompts with version control, collaboration, and testing features.
        </Typography>
        <Button 
          variant="contained" 
          size="large"
          onClick={() => navigate('/repositories/new')}
          sx={{
            mt: 2,
            background: 'linear-gradient(45deg, #4568dc, #b06ab3)',
            boxShadow: '0 4px 12px rgba(176, 106, 179, 0.2)',
            '&:hover': {
              background: 'linear-gradient(45deg, #3457cb, #9f59a2)',
              boxShadow: '0 6px 16px rgba(176, 106, 179, 0.3)',
            }
          }}
        >
          Create Repository
        </Button>
      </Paper>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Home; 