import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardActionArea,
  Typography, 
  Avatar, 
  Chip, 
  Stack, 
  Grid,
  Pagination,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import { 
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Public as PublicIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

interface Repository {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  owner_user: {
    id: string;
    username: string;
  } | null;
  owner_org: {
    id: string;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
  stars_count?: number;
  prompt?: {
    id: string;
  };
}

interface RepositoryListProps {
  username?: string;
  orgName?: string;
  showFilters?: boolean;
}

const RepositoryList: React.FC<RepositoryListProps> = ({ username, orgName, showFilters = true }) => {
  const { user } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updated_at');
  const [order, setOrder] = useState('DESC');
  const [isPublic, setIsPublic] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const ITEMS_PER_PAGE = 10;
  
  useEffect(() => {
    const fetchRepositories = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params: any = {
          page,
          limit: ITEMS_PER_PAGE,
          sort,
          order
        };
        
        if (username) params.username = username;
        if (orgName) params.orgName = orgName;
        if (isPublic !== 'all') params.isPublic = isPublic === 'public';
        if (search) params.search = search;
        
        const response = await axios.get('/repositories', { params });
        
        setRepositories(response.data.repositories);
        setTotalCount(response.data.pagination.total);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch repositories');
        console.error('Error fetching repositories:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRepositories();
  }, [page, sort, order, isPublic, search, username, orgName]);
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  const handleSortChange = (event: SelectChangeEvent) => {
    setSort(event.target.value);
  };
  
  const handleOrderChange = (event: SelectChangeEvent) => {
    setOrder(event.target.value);
  };
  
  const handleVisibilityChange = (event: SelectChangeEvent) => {
    setIsPublic(event.target.value);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1); // Reset to first page when search changes
  };
  
  const getRepoOwnerName = (repo: Repository) => {
    return repo.owner_user ? repo.owner_user.username : 
      repo.owner_org ? repo.owner_org.name : 'Unknown';
  };
  
  return (
    <Box>
      {showFilters && (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search repositories..."
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="visibility-label">Visibility</InputLabel>
                <Select
                  labelId="visibility-label"
                  value={isPublic}
                  label="Visibility"
                  onChange={handleVisibilityChange}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="sort-by-label">Sort by</InputLabel>
                <Select
                  labelId="sort-by-label"
                  value={sort}
                  label="Sort by"
                  onChange={handleSortChange}
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="created_at">Created</MenuItem>
                  <MenuItem value="updated_at">Updated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="order-label">Order</InputLabel>
                <Select
                  labelId="order-label"
                  value={order}
                  label="Order"
                  onChange={handleOrderChange}
                >
                  <MenuItem value="ASC">Ascending</MenuItem>
                  <MenuItem value="DESC">Descending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {isLoading ? (
        <Typography>Loading repositories...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : repositories.length === 0 ? (
        <Typography>No repositories found</Typography>
      ) : (
        <>
          <Stack spacing={2}>
            {repositories.map((repo) => (
              <Card key={repo.id} sx={{ display: 'flex', flexDirection: 'column' }}>
                <CardActionArea component={Link} to={repo.prompt?.id ? `/prompts/${repo.prompt.id}` : `/repositories/${repo.id}`}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {repo.is_public ? <PublicIcon fontSize="small" sx={{ mr: 1 }} /> : <LockIcon fontSize="small" sx={{ mr: 1 }} />}
                          <Typography variant="h6" component="div">
                            {repo.name}
                          </Typography>
                          {repo.prompt?.id && (
                            <Chip
                              label="Has Prompt"
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {repo.description || 'No description provided'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            {getRepoOwnerName(repo)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>•</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Updated {format(new Date(repo.updated_at), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip
                          icon={<StarIcon fontSize="small" />}
                          label={repo.stars_count || 0}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={Math.ceil(totalCount / ITEMS_PER_PAGE)} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default RepositoryList; 