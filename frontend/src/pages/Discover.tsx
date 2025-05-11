import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress,
  TextField,
  InputAdornment,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Pagination
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RepositoryWideCard from '../components/Repository/RepositoryWideCard';
import RepositoryService from '../services/RepositoryService';
import { Repository, Organization } from '../interfaces';

const Discover: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [contentType, setContentType] = useState('repositories');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchRepositories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use trending endpoint for repositories - this matches the existing backend API
      const response = await api.get('/repositories/trending', {
        params: { 
          limit: ITEMS_PER_PAGE
        }
      });
      
      setRepositories(response.data.repositories || []);
      setTotalPages(1); // No pagination available for trending endpoint
    } catch (error) {
      console.error('Error fetching repositories:', error);
      setError('Failed to load repositories. Please try again later.');
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the popular organizations endpoint - this matches the existing backend API
      const response = await api.get('/organizations/popular', {
        params: { 
          limit: ITEMS_PER_PAGE
        }
      });
      
      setOrganizations(response.data.organizations || []);
      setTotalPages(1); // No pagination available for popular endpoint
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError('Failed to load organizations. Please try again later.');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (contentType === 'repositories') {
      fetchRepositories();
    } else {
      fetchOrganizations();
    }
  }, [contentType, fetchRepositories, fetchOrganizations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) {
      // If search query is empty, fetch normal data
      if (contentType === 'repositories') {
        fetchRepositories();
      } else {
        fetchOrganizations();
      }
      return;
    }

    // Handle search
    setLoading(true);
    setError(null);

    if (contentType === 'repositories') {
      // Search repositories - assuming a search endpoint exists
      api.get('/repositories', {
        params: { 
          search: searchQuery,
          limit: ITEMS_PER_PAGE
        }
      })
      .then(response => {
        setRepositories(response.data.repositories || []);
        setTotalPages(Math.ceil((response.data.pagination?.total || 0) / ITEMS_PER_PAGE) || 1);
      })
      .catch(error => {
        console.error('Error searching repositories:', error);
        setError('Failed to search repositories. Please try again.');
        setRepositories([]);
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      // Search organizations using the search endpoint
      api.get('/organizations', {
        params: { 
          query: searchQuery,
          limit: ITEMS_PER_PAGE
        }
      })
      .then(response => {
        setOrganizations(response.data.organizations || []);
        setTotalPages(Math.ceil((response.data.pagination?.total || 0) / ITEMS_PER_PAGE) || 1);
      })
      .catch(error => {
        console.error('Error searching organizations:', error);
        setError('Failed to search organizations. Please try again.');
        setOrganizations([]);
      })
      .finally(() => {
        setLoading(false);
      });
    }
  };

  const handleStarRepo = async (repoId: string, isStarred: boolean) => {
    if (!user) {
      navigate('/login', { state: { from: '/discover' } });
      return;
    }
    
    try {
      if (isStarred) {
        await RepositoryService.unstarRepository(repoId);
      } else {
        await RepositoryService.starRepository(repoId);
      }
      
      // Refresh the repositories data
      fetchRepositories();
    } catch (error) {
      console.error('Error updating repository star:', error);
      setError('Failed to update star status. Please try again.');
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
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
                setPage(1);
              }}
            >
              Repositories
            </Button>
            <Button 
              variant={contentType === 'organizations' ? "contained" : "outlined"}
              onClick={() => {
                setContentType('organizations');
                setPage(1);
              }}
            >
              Organizations
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Content Section */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" component="h2" fontWeight={600} sx={{ mb: 3 }}>
          {contentType === 'repositories' ? 'Trending Repositories' : 'Popular Organizations'}
        </Typography>

        {/* Error state */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Loading state */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Empty state */}
            {(contentType === 'repositories' && repositories.length === 0) || 
             (contentType === 'organizations' && organizations.length === 0) ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No {contentType} found. {searchQuery && "Try adjusting your search criteria."}
              </Alert>
            ) : (
              <>
                {/* Repository Cards Grid */}
                {contentType === 'repositories' && (
                  <Grid container spacing={3}>
                    {repositories.map((repo) => (
                      <Grid item xs={12} md={6} key={repo.id}>
                        <RepositoryWideCard
                          repository={repo}
                          onStar={handleStarRepo}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* Organization Cards Grid */}
                {contentType === 'organizations' && (
                  <Grid container spacing={3}>
                    {organizations.map((org) => (
                      <Grid item xs={12} sm={6} md={4} key={org.id}>
                        <Paper
                          elevation={1}
                          sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            overflow: 'hidden',
                            borderRadius: 2,
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                            }
                          }}
                        >
                          <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            {/* Organization Header */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Box 
                                component="img"
                                src={org.logo_image_id ? `/api/organizations/logo/${org.logo_image_id}` : undefined}
                                alt={org.display_name}
                                sx={{ 
                                  width: 56, 
                                  height: 56,
                                  borderRadius: '50%',
                                  marginRight: 2,
                                  bgcolor: 'primary.main',
                                  display: org.logo_image_id ? 'block' : 'none'
                                }}
                              />
                              {!org.logo_image_id && (
                                <Box 
                                  sx={{ 
                                    width: 56, 
                                    height: 56,
                                    borderRadius: '50%',
                                    marginRight: 2,
                                    bgcolor: 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <BusinessIcon sx={{ color: 'white' }} />
                                </Box>
                              )}
                              <Box>
                                <Typography 
                                  variant="h6"
                                  component="a"
                                  href={`/organizations/${org.name}`}
                                  sx={{ 
                                    textDecoration: 'none', 
                                    color: 'inherit',
                                    display: 'block',
                                    '&:hover': { color: 'primary.main' } 
                                  }}
                                >
                                  {org.display_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  @{org.name}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Typography variant="body2" sx={{ mb: 2, minHeight: '40px' }}>
                              {org.description?.substring(0, 100) || 'No description'}
                              {(org.description?.length || 0) > 100 ? '...' : ''}
                            </Typography>
                            
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center', 
                              mt: 'auto',
                              flexWrap: 'wrap'
                            }}>
                              <Typography variant="body2" color="text.secondary">
                                {org.member_count || 0} members
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {org.repository_count || 0} repos
                              </Typography>
                            </Box>
                            
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'center',
                              mt: 2
                            }}>
                              <Button
                                variant="outlined"
                                size="small"
                                href={`/organizations/${org.name}`}
                                fullWidth
                              >
                                View Organization
                              </Button>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* Pagination - only show if there's more than one page */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination 
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Discover; 