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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Pagination,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Organization } from '../interfaces';
import OrganizationCard from '../components/Organization/OrganizationCard';

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
          Organizations
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
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={10}>
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
          <Grid item xs={12} md={2}>
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
      </Box>

      {/* Organizations Grid */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" component="h2" fontWeight={600} sx={{ mb: 3 }}>
          My Organizations
        </Typography>

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
                  <OrganizationCard organization={org} withLink={true} />
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
      </Paper>
    </Container>
  );
};

export default Organizations; 