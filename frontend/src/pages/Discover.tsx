import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Person as PersonIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Repository {
  id: string;
  name: string;
  description: string;
  star_count: number;
  stars_count: number;
  is_starred: boolean;
  isStarred: boolean;
  created_at: string;
  owner: {
    id: string;
    name: string;
    display_name: string;
    profile_image_id?: string;
  };
  owner_user?: {
    id: string;
    username: string;
    profile_image_id?: string;
  };
}

const Discover: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('stars');
  const [contentType, setContentType] = useState('repositories');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (contentType === 'repositories') {
        // Use the working trending endpoint instead
        const response = await api.get('/repositories/trending', {
          params: { 
            limit: 20
          }
        });
        
        setRepositories(response.data.repositories || []);
      } else if (contentType === 'organizations') {
        // Use the working organizations endpoint
        const response = await api.get('/organizations/popular', {
          params: { 
            limit: 20
          }
        });
        
        setRepositories(response.data.organizations || []);
      }
    } catch (error) {
      console.error(`Error fetching ${contentType}:`, error);
      setError(`Failed to load ${contentType}. Please try again later.`);
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  }, [contentType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleStarRepo = async (repoId: string, isStarred: boolean) => {
    if (!user) {
      navigate('/login', { state: { from: '/discover' } });
      return;
    }
    
    try {
      // Update UI immediately for better user experience
      setRepositories(prev => 
        prev.map(repo => {
          if (repo.id === repoId) {
            const starCount = (repo.stars_count !== undefined ? repo.stars_count : repo.star_count || 0);
            return { 
              ...repo, 
              isStarred: !isStarred,
              is_starred: !isStarred,
              stars_count: isStarred ? starCount - 1 : starCount + 1,
              star_count: isStarred ? starCount - 1 : starCount + 1
            };
          }
          return repo;
        })
      );
      
      // Call the appropriate service method
      if (isStarred) {
        await api.delete(`/repositories/${repoId}/star`);
      } else {
        await api.post(`/repositories/${repoId}/star`);
      }
      
      // No need to refresh data immediately as we've already updated UI
      // This avoids potential flickering and provides a smooth user experience
    } catch (error) {
      console.error('Error starring repository:', error);
      
      // Refresh data only in case of error to restore the correct state
      await fetchData();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          PromptHub Community
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore the community's repositories, organizations, and more!
        </Typography>
      </Paper>

      {/* Search and Filter Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box 
          component="form" 
          onSubmit={handleSearch}
          sx={{ 
            display: 'flex', 
            mb: 3,
            gap: 2
          }}
        >
          <TextField
            placeholder="Search repositories or organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
          >
            Search
          </Button>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant={contentType === 'repositories' ? "contained" : "outlined"}
              onClick={() => {
                setContentType('repositories');
                setSortBy('stars');
              }}
            >
              Repositories
            </Button>
            <Button 
              variant={contentType === 'organizations' ? "contained" : "outlined"}
              onClick={() => {
                setContentType('organizations');
                setSortBy('name');
              }}
            >
              Organizations
            </Button>
          </Box>
          
          <FormControl size="small" variant="outlined" sx={{ minWidth: 180 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
              startAdornment={<SortIcon fontSize="small" sx={{ mr: 1 }} />}
            >
              {contentType === 'repositories' && (
                <>
                  <MenuItem value="stars">Most stars</MenuItem>
                  <MenuItem value="created_at">Newest</MenuItem>
                  <MenuItem value="name">Alphabetical</MenuItem>
                </>
              )}
              {contentType === 'organizations' && (
                <>
                  <MenuItem value="name">Alphabetical</MenuItem>
                  <MenuItem value="created_at">Newest</MenuItem>
                </>
              )}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Content Section */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" component="h2" fontWeight={600} sx={{ mb: 3 }}>
          {contentType === 'repositories' ? 'Popular Repositories' : 'Active Organizations'}
        </Typography>

        {/* Repository/Organization Cards */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {repositories.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No items found matching your criteria
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {repositories.map((repo) => (
                  <Grid item xs={12} md={6} key={repo.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        borderRadius: 2,
                        border: '1px solid #eaeaea',
                        boxShadow: 'none',
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <Avatar 
                            src={
                              (repo.owner?.profile_image_id ? 
                                `/api/images/${repo.owner.profile_image_id}` : 
                                repo.owner_user?.profile_image_id ? 
                                  `/api/accounts/profile-image/${repo.owner_user.profile_image_id}` : 
                                  undefined)
                            }
                            alt={repo.owner?.display_name || repo.owner_user?.username || ''}
                            sx={{ width: 40, height: 40, mr: 2 }}
                          >
                            {(repo.owner?.display_name?.[0]?.toUpperCase() || 
                              repo.owner_user?.username?.[0]?.toUpperCase() || 
                              <PersonIcon />)
                            }
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="h6" 
                              component={Link}
                              to={contentType === 'repositories' ? 
                                `/repositories/${repo.id}` : 
                                `/organizations/${repo.owner?.name || repo.name}`
                              }
                              sx={{ 
                                fontWeight: 600, 
                                color: 'text.primary',
                                textDecoration: 'none',
                                '&:hover': { color: 'primary.main' },
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {repo.name}
                            </Typography>
                            
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              component={Link}
                              to={repo.owner_user ? 
                                `/profile/${repo.owner_user.username}` : 
                                repo.owner ? 
                                  `/organizations/${repo.owner.name}` : 
                                  '#'
                              }
                              sx={{ 
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' }
                              }}
                            >
                              {repo.owner?.display_name || repo.owner_user?.username || ''}
                            </Typography>
                          </Box>
                          
                          {contentType === 'repositories' && user && (
                            <IconButton 
                              onClick={() => handleStarRepo(
                                repo.id, 
                                repo.isStarred !== undefined ? repo.isStarred : (repo.is_starred || false)
                              )}
                              size="small"
                              color="primary"
                              aria-label={
                                (repo.isStarred || repo.is_starred) ? "Unstar repository" : "Star repository"
                              }
                            >
                              {(repo.isStarred || repo.is_starred) ? (
                                <StarIcon fontSize="small" sx={{ color: '#f1c40f' }} />
                              ) : (
                                <StarBorderIcon fontSize="small" />
                              )}
                            </IconButton>
                          )}
                        </Box>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {repo.description || 'No description provided'}
                        </Typography>
                        
                        {contentType === 'repositories' && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StarIcon fontSize="small" sx={{ color: '#f1c40f', mr: 0.5 }} />
                              <Typography variant="body2">
                                {repo.stars_count !== undefined ? repo.stars_count : (repo.star_count || 0)}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Discover; 