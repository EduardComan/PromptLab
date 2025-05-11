import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Pagination,
  Stack,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Stars as StarsIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { Organization } from '../interfaces';

const Organizations: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<string>('popularity');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    fetchOrganizations();
  }, [page, sort]);

  const fetchOrganizations = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/organizations/popular', { 
        params: { 
          limit: 12,
        } 
      });
      setOrganizations(response.data.organizations || []);
      setTotalPages(1);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to load organizations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    fetchOrganizations();
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    setSort(event.target.value);
    setPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Container maxWidth="lg">
      {/* Header Section */}
      <Box
        sx={{
          pt: 4,
          pb: 2,
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
      
      <Box>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Create New Organization
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
          Manage prompts as a team with organizations
        </Typography>
      </Box>

        {user && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/organizations/new')}
            sx={{
              background: 'linear-gradient(45deg, #4568dc, #b06ab3)',
              boxShadow: '0 4px 12px rgba(176, 106, 179, 0.2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #3457cb, #9f59a2)',
                boxShadow: '0 6px 16px rgba(176, 106, 179, 0.3)',
              }
            }}
          >
            Create Organization
          </Button>
        )}
      </Box>

      {/* Search and Filter Section */}
      <Paper
        elevation={1}
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 2,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                label="Search organizations"
                variant="outlined"
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button type="submit" variant="contained" sx={{ ml: 1 }}>
                        <SearchIcon />
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </form>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="sort-select-label">Sort by</InputLabel>
              <Select
                labelId="sort-select-label"
                value={sort}
                onChange={handleSortChange}
                label="Sort by"
              >
                <MenuItem value="popularity">Popularity (Stars)</MenuItem>
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="name_asc">Name A-Z</MenuItem>
                <MenuItem value="name_desc">Name Z-A</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Organizations Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : organizations.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No organizations found. {search && "Try adjusting your search criteria."}
        </Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {organizations.map((org) => (
              <Grid item xs={12} sm={6} md={4} key={org.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Organization Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        src={org.logo_image_id ? `/api/organizations/logo/${org.logo_image_id}` : undefined}
                        sx={{ 
                          width: 56, 
                          height: 56,
                          marginRight: 2,
                          bgcolor: 'primary.main'
                        }}
                      >
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component={Link} to={`/organizations/${org.name}`} 
                          sx={{ 
                            textDecoration: 'none', 
                            color: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
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
                      justifyContent: 'center',
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 2,
                      flexWrap: 'wrap' 
                    }}>
                      <Chip 
                        icon={<PeopleIcon />} 
                        label={`${org.member_count || 0} members`} 
                        variant="outlined" 
                        size="small"
                      />
                      <Chip 
                        icon={<StarsIcon />} 
                        label={`${org.repository_count || 0} repos`} 
                        variant="outlined" 
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      Created {formatDistanceToNow(new Date(org.created_at))} ago
                    </Typography>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <Button 
                      component={Link} 
                      to={`/organizations/${org.name}`}
                      size="small" 
                      fullWidth
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1
                      }}
                    >
                      <BusinessIcon fontSize="small" />
                      View Organization Profile
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
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
    </Container>
  );
};

export default Organizations; 