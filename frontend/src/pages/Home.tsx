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
  InputAdornment
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Sync as RecentIcon,
  Person as PersonIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import RepositoryGrid from '../components/Repository/RepositoryGrid';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [trendingRepos, setTrendingRepos] = useState<any[]>([]);
  const [recentRepos, setRecentRepos] = useState<any[]>([]);
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRepos = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch trending repositories by star count
      const trendingResponse = await api.get('/repositories', {
        params: { limit: 8, sort: 'stars', order: 'desc' }
      });

      // Fetch recent repositories
      const recentResponse = await api.get('/repositories', {
        params: { limit: 8, sort: 'created_at', order: 'desc' }
      });
      
      setTrendingRepos(trendingResponse.data.repositories || []);
      setRecentRepos(recentResponse.data.repositories || []);

      // If user is logged in, fetch their repositories
      if (user) {
        const userReposResponse = await api.get(`/repositories/user/${user.username}`, {
          params: { limit: 4 }
        });
        setUserRepos(userReposResponse.data.repositories || []);
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
      if (isStarred) {
        await api.delete(`/repositories/${repoId}/star`);
      } else {
        await api.post(`/repositories/${repoId}/star`);
      }
      
      // Refresh the repository data
      fetchRepos();
    } catch (error) {
      console.error('Error starring repository:', error);
    }
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box
              role="tabpanel"
              hidden={tabValue !== 0}
              id="tabpanel-0"
              aria-labelledby="tab-0"
            >
              {tabValue === 0 && (
                <RepositoryGrid 
                  repositories={trendingRepos} 
                  title="Trending Repositories"
                  emptyMessage="No trending repositories found. Be the first to create one!" 
                  onStar={handleStarRepo}
                />
              )}
            </Box>
            <Box
              role="tabpanel"
              hidden={tabValue !== 1}
              id="tabpanel-1"
              aria-labelledby="tab-1"
            >
              {tabValue === 1 && (
                <RepositoryGrid 
                  repositories={recentRepos} 
                  title="Recently Created"
                  emptyMessage="No recent repositories found. Be the first to create one!"
                  onStar={handleStarRepo}
                />
              )}
            </Box>
            {user && (
              <Box
                role="tabpanel"
                hidden={tabValue !== 2}
                id="tabpanel-2"
                aria-labelledby="tab-2"
              >
                {tabValue === 2 && (
                  <RepositoryGrid 
                    repositories={userRepos} 
                    title="Your Repositories"
                    emptyMessage="You don't have any repositories yet. Create one to get started!"
                    onStar={handleStarRepo}
                  />
                )}
              </Box>
            )}
          </>
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
    </Container>
  );
};

export default Home; 