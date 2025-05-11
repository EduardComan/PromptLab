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
  MenuItem,
  Fade,
  Divider,
  Tooltip,
  Stack
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Person as PersonIcon,
  Sort as SortIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  GroupOutlined as GroupIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RepositoryService from '../services/RepositoryService';

interface Repository {
  id: string;
  name: string;
  description: string;
  star_count: number;
  stars_count: number;
  is_starred: boolean;
  isStarred: boolean;
  created_at: string;
  // Organization specific fields
  display_name?: string;
  logo_image_id?: string;
  member_count?: number;
  repository_count?: number;
  total_stars?: number;
  // Repository specific fields
  owner?: {
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
  const [isSearchActive, setIsSearchActive] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (contentType === 'repositories') {
        // Use search endpoint if search is active, otherwise use trending
        const endpoint = isSearchActive && searchQuery 
          ? '/repositories/search' 
          : '/repositories/trending';
        
        const params: Record<string, any> = { limit: 20 };
        
        // Only add search param if needed
        if (isSearchActive && searchQuery) {
          params.query = searchQuery;
          params.sort = sortBy;
        }
        
        console.log(`Fetching ${isSearchActive ? 'search results' : 'trending repositories'}`);
        const response = await api.get(endpoint, { params });
        
        console.log('Repositories response:', response.data);
        
        if (!response.data || !response.data.repositories) {
          throw new Error('Invalid response format from server');
        }
        
        setRepositories(response.data.repositories || []);
      } else if (contentType === 'organizations') {
        // Use search endpoint if search is active, otherwise use popular
        const endpoint = isSearchActive && searchQuery
          ? '/organizations/search'
          : '/organizations/popular';
        
        const params: Record<string, any> = { limit: 20 };
        
        // Only add search param if needed
        if (isSearchActive && searchQuery) {
          params.query = searchQuery;
          params.sort = sortBy;
        }
        
        console.log(`Fetching ${isSearchActive ? 'search results' : 'popular organizations'}`);
        const response = await api.get(endpoint, { params });
        
        console.log('Organizations response:', response.data);
        
        if (!response.data || !response.data.organizations) {
          throw new Error('Invalid response format from server');
        }
        
        // Detailed logging of organization data
        if (response.data.organizations.length > 0) {
          console.log('First organization example:', response.data.organizations[0]);
        }
        
        setRepositories(response.data.organizations || []);
      }
    } catch (error) {
      console.error(`Error fetching ${contentType}:`, error);
      setError(`Failed to load ${contentType}. Please try again later.`);
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  }, [contentType, searchQuery, sortBy, isSearchActive]);

  useEffect(() => {
    // Reset search state when switching content types
    if (!isSearchActive) {
      fetchData();
    }
  }, [fetchData, contentType, sortBy, isSearchActive]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchActive(true);
      fetchData();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
  };

  const handleStarRepo = async (repoId: string, isStarred: boolean) => {
    if (!user) {
      navigate('/login', { state: { from: '/discover' } });
      return;
    }
    
    try {
      // Call the appropriate service method and get the accurate star count from backend
      let updatedStars = 0;
      
      if (isStarred) {
        const result = await RepositoryService.unstarRepository(repoId);
        updatedStars = result.stars;
      } else {
        const result = await RepositoryService.starRepository(repoId);
        updatedStars = result.stars;
      }
      
      // Update UI with the accurate star count from backend
      setRepositories(prev => 
        prev.map(repo => {
          if (repo.id === repoId) {
            return { 
              ...repo, 
              isStarred: !isStarred,
              is_starred: !isStarred,
              stars_count: updatedStars,
              star_count: updatedStars
            };
          }
          return repo;
        })
      );
      
    } catch (error) {
      console.error('Error starring repository:', error);
      
      // Refresh data only in case of error to restore the correct state
      await fetchData();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box>
        <Typography variant="h4" component="h1" fontWeight="bold">
          PromptLab Community
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 3, mb: 4 }}>
          Explore the community's repositories, organizations, and more!
        </Typography>
      </Box>

      {/* Search and Filter Section */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          transition: 'all 0.3s ease',
          border: isSearchActive ? '1px solid #4a90e2' : '1px solid #eaeaea'
        }}
      >
        <Box 
          component="form" 
          onSubmit={handleSearch}
          sx={{ 
            display: 'flex', 
            mb: 3,
            gap: 2,
            position: 'relative'
          }}
        >
          <TextField
            placeholder={`Search ${contentType === 'repositories' ? 'prompts, models, tools...' : 'organizations, teams...'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                transition: 'all 0.2s',
                '&.Mui-focused': {
                  boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.2)'
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color={isSearchActive ? "primary" : "action"} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClearSearch}
                    edge="end"
                    size="small"
                    aria-label="clear search"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={!searchQuery.trim()}
            sx={{ 
              borderRadius: '8px',
              minWidth: '120px',
              fontWeight: 600
            }}
          >
            Search
          </Button>
        </Box>

        {isSearchActive && (
          <Fade in={true}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip 
                label={`Searching: "${searchQuery}"`}
                onDelete={handleClearSearch}
                color="primary"
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {repositories.length} results found
              </Typography>
            </Box>
          </Fade>
        )}

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Browse repositories">
              <Button 
                variant={contentType === 'repositories' ? "contained" : "outlined"}
                onClick={() => {
                  setContentType('repositories');
                  setSortBy('stars');
                  if (isSearchActive) {
                    // Re-run search with new content type
                    fetchData();
                  }
                }}
                startIcon={<TrendingIcon />}
                sx={{ borderRadius: '8px' }}
              >
                Repositories
              </Button>
            </Tooltip>
            <Tooltip title="Browse organizations">
              <Button 
                variant={contentType === 'organizations' ? "contained" : "outlined"}
                onClick={() => {
                  setContentType('organizations');
                  setSortBy('name');
                  if (isSearchActive) {
                    // Re-run search with new content type
                    fetchData();
                  }
                }}
                startIcon={<PersonIcon />}
                sx={{ borderRadius: '8px' }}
              >
                Organizations
              </Button>
            </Tooltip>
          </Box>
          
          <FormControl size="small" variant="outlined" sx={{ minWidth: 180 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                if (isSearchActive) {
                  // Re-run search with new sort
                  fetchData();
                }
              }}
              label="Sort By"
              sx={{ borderRadius: '8px' }}
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
          {isSearchActive ? 
            `Search Results` : 
            contentType === 'repositories' ? 
              'Popular Repositories' : 
              'Active Organizations'
          }
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
                  {isSearchActive ? 
                    `No results found for "${searchQuery}"` : 
                    'No items found matching your criteria'
                  }
                </Typography>
                {isSearchActive && (
                  <Button 
                    onClick={handleClearSearch}
                    variant="outlined" 
                    sx={{ mt: 2 }}
                  >
                    Clear Search
                  </Button>
                )}
              </Box>
            ) : (
              <Grid container spacing={3}>
                {repositories.map((repo) => (
                  <Grid item xs={12} md={6} key={repo.id}>
                    {contentType === 'repositories' ? (
                      /* Repository Card */
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
                              alt={"Created by: " + (repo.owner_user?.username) || repo.owner_user?.username || ''}
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
                                to={`/repositories/${repo.id}`}
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
                            
                            {user && (
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
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StarIcon fontSize="small" sx={{ color: '#f1c40f', mr: 0.5 }} />
                              <Typography variant="body2">
                                {repo.stars_count !== undefined ? repo.stars_count : (repo.star_count || 0)}
                              </Typography>
                            </Box>
                            {repo.created_at && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {formatDistanceToNow(new Date(repo.created_at), { addSuffix: true })}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ) : (
                      /* Organization Card */
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
                              src={repo.logo_image_id ? `/api/images/${repo.logo_image_id}` : undefined}
                              alt={repo.display_name || repo.name || ''}
                              sx={{ width: 50, height: 50, mr: 2, bgcolor: 'primary.main' }}
                            >
                              {repo.display_name?.[0]?.toUpperCase() || repo.name?.[0]?.toUpperCase() || <BusinessIcon />}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="h6" 
                                component={Link}
                                to={`/organizations/${repo.name}`}
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
                                {repo.display_name || repo.name}
                              </Typography>
                              
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                              >
                                @{repo.name}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              mb: 3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              minHeight: '40px'
                            }}
                          >
                            {repo.description || 'No description provided'}
                          </Typography>
                          
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              mb: 2 
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <GroupIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                              <Typography variant="body2" color="text.secondary">
                                {repo.member_count || 0} members
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CodeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                              <Typography variant="body2" color="text.secondary">
                                {repo.repository_count || 0} repos
                              </Typography>
                            </Box>
                          </Box>
                          
                          {repo.created_at && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <CalendarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                              <Typography variant="body2" color="text.secondary">
                                {formatDistanceToNow(new Date(repo.created_at), { addSuffix: true })}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    )}
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