import {
  Clear as ClearIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Fade,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizationCard from '../components/Organization/OrganizationCard';
import RepositoryCard from '../components/Repository/RepositoryCard';
import { useAuth } from '../contexts/AuthContext';
import { Organization, Repository } from '../interfaces';
import api from '../services/api';
import RepositoryService from '../services/RepositoryService';

interface DiscoverRepository extends Repository {}
interface DiscoverOrganization extends Organization {}

const Discover: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Array<DiscoverRepository | DiscoverOrganization>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('stars');
  const [contentType, setContentType] = useState<'repositories' | 'organizations'>('repositories');
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
        
        setItems(response.data.repositories || []);
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
        
        setItems(response.data.organizations || []);
      }
    } catch (error) {
      console.error(`Error fetching ${contentType}:`, error);
      setError(`Failed to load ${contentType}. Please try again later.`);
      setItems([]);
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
      setItems(prev => 
        prev.map(item => {
          if (contentType === 'repositories' && 'id' in item && item.id === repoId) {
            return { 
              ...item, 
              isStarred: !isStarred,
              is_starred: !isStarred,
              stars_count: updatedStars,
              star_count: updatedStars
            } as DiscoverRepository;
          }
          return item;
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
                {items.length} results found
              </Typography>
            </Box>
          </Fade>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
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

        <Divider sx={{ mt: 4, mb: 4 }} />


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
            {items.length === 0 ? (
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
                {items.map((item) => (
                  <Grid item xs={12} md={6} key={item.id}>
                    {contentType === 'repositories' ? (
                      <RepositoryCard 
                        repository={item as DiscoverRepository} 
                        onStar={handleStarRepo}
                      />
                    ) : (
                      <OrganizationCard 
                        organization={item as DiscoverOrganization}
                      />
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