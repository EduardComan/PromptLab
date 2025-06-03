import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrganizationCard from '../components/Organization/OrganizationCard';
import { useAuth } from '../contexts/AuthContext';
import { Organization } from '../interfaces';
import api from '../services/api';

const Organizations: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name_asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/organizations/me');
        setAllOrganizations(response.data.organizations || []);
      } catch (err) {
        console.error('Error fetching user organizations:', err);
        setError('Failed to load your organizations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrganizations();
    } else {
      setLoading(false);
      setAllOrganizations([]);
    }
  }, [user]);

  const filteredOrganizations = useMemo(() => {
    let filtered = allOrganizations.filter(org =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      org.description?.toLowerCase().includes(search.toLowerCase())
    );

    if (sort === 'name_asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name_desc') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sort === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return filtered;
  }, [allOrganizations, search, sort]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setSearch('');
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    setSort(event.target.value);
  };

  return (
    <Container maxWidth="lg">
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
            Manage and collaborate with your organizations
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

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={10}>
            <TextField
              fullWidth
              placeholder="Search organizations"
              variant="outlined"
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color={search ? 'primary' : 'action'} />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} size="small">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
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
                <MenuItem value="name_asc">Name A-Z</MenuItem>
                <MenuItem value="name_desc">Name Z-A</MenuItem>
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" component="h2" fontWeight={600} sx={{ mb: 3 }}>
          {search ? `Search Results (${filteredOrganizations.length})` : 'My Organizations'}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        ) : !user ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Please log in to view your organizations.
          </Alert>
        ) : filteredOrganizations.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            {search 
              ? "No organizations found matching your search criteria." 
              : "You are not part of any organizations yet. Create one or ask to be invited to an existing organization."
            }
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredOrganizations.map((org) => (
              <Grid item xs={12} sm={6} md={4} key={org.id}>
                <OrganizationCard organization={org} withLink={true} />
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default Organizations;