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
  is_starred: boolean;
  created_at: string;
  owner: {
    id: string;
    name: string;
    display_name: string;
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
  const [contentType, setContentType] = useState('prompts');

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch repositories based on sort criteria
      const response = await api.get('/api/repositories', {
        params: { 
          limit: 20, 
          sort: sortBy, 
          order: 'desc',
          q: searchQuery || undefined
        }
      });
      
      setRepositories(response.data.repositories || []);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      setError('Failed to load repositories. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [sortBy, searchQuery]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrompts();
  };

  const handleStarRepo = async (repoId: string, isStarred: boolean) => {
    if (!user) {
      navigate('/login', { state: { from: '/discover' } });
      return;
    }
    
    try {
      if (isStarred) {
        await api.delete(`/api/repositories/${repoId}/star`);
      } else {
        await api.post(`/api/repositories/${repoId}/star`);
      }
      
      // Update the repository in the state
      setRepositories(prev => 
        prev.map(repo => 
          repo.id === repoId 
            ? { 
                ...repo, 
                is_starred: !isStarred,
                star_count: isStarred ? repo.star_count - 1 : repo.star_count + 1
              } 
            : repo
        )
      );
    } catch (error) {
      console.error('Error starring repository:', error);
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
          Explore the community's prompts, repositories, organizations, and more!
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
            placeholder="Search repositories, prompts, or organizations..."
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
              variant={contentType === 'prompts' ? "contained" : "outlined"}
              onClick={() => setContentType('prompts')}
            >
              Prompts
            </Button>
            <Button 
              variant={contentType === 'repositories' ? "contained" : "outlined"}
              onClick={() => setContentType('repositories')}
            >
              Repositories
            </Button>
            <Button 
              variant={contentType === 'organizations' ? "contained" : "outlined"}
              onClick={() => setContentType('organizations')}
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
              <MenuItem value="stars">Most stars</MenuItem>
              <MenuItem value="created_at">Newest</MenuItem>
              <MenuItem value="name">Alphabetical</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Content Section */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" component="h2" fontWeight={600} sx={{ mb: 3 }}>
          {contentType === 'prompts' ? 'Trending Prompts' : 
           contentType === 'repositories' ? 'Popular Repositories' : 'Active Organizations'}
        </Typography>

        {/* Repository/Prompt Cards */}
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
                            src={repo.owner.profile_image_id ? `/api/images/${repo.owner.profile_image_id}` : undefined}
                            alt={repo.owner.display_name}
                            sx={{ width: 40, height: 40, mr: 2 }}
                          >
                            {repo.owner.display_name?.[0]?.toUpperCase() || <PersonIcon />}
                          </Avatar>
                          
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography 
                                variant="h6" 
                                component={Link} 
                                to={`/repositories/${repo.id}`}
                                sx={{ 
                                  textDecoration: 'none', 
                                  color: 'inherit',
                                  '&:hover': {
                                    color: 'primary.main'
                                  }
                                }}
                              >
                                {repo.name}
                              </Typography>
                              <IconButton 
                                size="small" 
                                color={repo.is_starred ? 'warning' : 'default'}
                                onClick={() => handleStarRepo(repo.id, repo.is_starred)}
                              >
                                {repo.is_starred ? <StarIcon /> : <StarBorderIcon />}
                              </IconButton>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {repo.description || 'No description provided.'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                              size="small" 
                              label="Prompt Engineering"
                              sx={{ 
                                bgcolor: 'rgba(25, 118, 210, 0.08)',
                                color: 'primary.main'
                              }}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              {repo.owner.display_name}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StarIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem', color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {repo.star_count || 0}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
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