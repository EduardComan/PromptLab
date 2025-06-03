import {
  Add as AddIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
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
import RepositoryCard from '../components/Repository/RepositoryCard';
import { useAuth } from '../contexts/AuthContext';
import { Organization, Repository } from '../interfaces';
import api from '../services/api';
import RepositoryService from '../services/RepositoryService';

const Discover: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [allRepositories, setAllRepositories] = useState<Repository[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<string>('created_at');
  const [contentType, setContentType] = useState<'repositories' | 'organizations'>('repositories');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all public repositories and all organizations
        const [reposRes, orgsRes] = await Promise.all([
          api.get('/repositories?isPublic=true&sort=updated_at&order=desc&limit=100'),
          api.get('/organizations?limit=50')
        ]);

        let repos: Repository[] = (reposRes.data.repositories || []).map((repo: any) => ({
          ...repo,
          stats: {
            ...(repo.stats || {}),
            stars: repo.stats?.stars ?? repo._count?.stars ?? 0,
            is_starred: false
          }
        }));

        let orgs: Organization[] = orgsRes.data.organizations || [];

        // Filter out current user's repositories and organizations they're part of
        if (user) {
          // Filter out repositories owned by current user
          repos = repos.filter(repo => 
            repo.owner_user_id !== user.id && 
            (!repo.owner_user || repo.owner_user.id !== user.id)
          );

          // Get user's organizations to filter them out
          try {
            const userOrgsRes = await api.get('/organizations/me');
            const userOrgIds = new Set(userOrgsRes.data.organizations?.map((org: any) => org.id) || []);
            
            // Filter out organizations the user is part of
            orgs = orgs.filter(org => !userOrgIds.has(org.id));
          } catch (orgError) {
            console.warn('Could not fetch user organizations:', orgError);
            // Continue without filtering organizations
          }

          // Get starred status for repositories
          try {
            const starredRes = await api.get('/accounts/me/starred');
            const starredIds = new Set(starredRes.data.repositories?.map((r: any) => r.id) || []);
            repos = repos.map(repo => ({
              ...repo,
              stats: {
                ...repo.stats,
                is_starred: starredIds.has(repo.id)
              }
            }));
          } catch (starError) {
            console.warn('Could not fetch starred repositories:', starError);
            // Continue without starred status
          }
        }

        setAllRepositories(repos);
        setAllOrganizations(orgs);
      } catch (err) {
        console.error('Error fetching discover data:', err);
        setError('Failed to load content.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Reset sort when switching content types to ensure valid values
  useEffect(() => {
    if (contentType === 'repositories') {
      // Ensure sort is valid for repositories
      if (!['stars', 'created_at', 'name'].includes(sort)) {
        setSort('created_at');
      }
    } else {
      // Ensure sort is valid for organizations
      if (!['name', 'created_at'].includes(sort)) {
        setSort('name');
      }
    }
  }, [contentType, sort]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setSearch('');
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    setSort(event.target.value);
  };

  const handleStarRepo = async (repoId: string, isStarred: boolean) => {
    if (!user) return navigate('/login', { state: { from: '/discover' } });
    try {
      const result = isStarred
        ? await RepositoryService.unstarRepository(repoId)
        : await RepositoryService.starRepository(repoId);

      setAllRepositories(prev =>
        prev.map(repo =>
          repo.id === repoId
            ? {
                ...repo,
                stats: {
                  ...(repo.stats || {}),
                  stars: result.stars,
                  is_starred: !isStarred
                }
              }
            : repo
        )
      );
    } catch (err) {
      console.error('Star error:', err);
    }
  };

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    let list: (Repository | Organization)[] =
      contentType === 'repositories' ? [...allRepositories] : [...allOrganizations];

    if (query) {
      list = list.filter(item =>
        item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query)
      );
    }

    if (sort === 'stars' && contentType === 'repositories') {
      list.sort((a, b) => ((b as Repository).stats?.stars ?? 0) - ((a as Repository).stats?.stars ?? 0));
    } else if (sort === 'created_at') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [search, sort, contentType, allRepositories, allOrganizations]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold">PromptLab Community</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 3, mb: 4 }}>
        Discover repositories and organizations from the PromptLab community. Find inspiration, collaborate, and explore what others are building!
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={10}>
            <TextField
              fullWidth
              label={`Search ${contentType === 'repositories' ? 'repositories' : 'organizations'}`}
              variant="outlined"
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {search && (
                      <IconButton onClick={handleClearSearch} size="small">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )}
                    <SearchIcon sx={{ ml: 1 }} />
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
                {contentType === 'repositories' ? (
                  <>
                    <MenuItem value="stars">Most stars</MenuItem>
                    <MenuItem value="created_at">Newest</MenuItem>
                    <MenuItem value="name">Alphabetical</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem value="name">Alphabetical</MenuItem>
                    <MenuItem value="created_at">Newest</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={contentType === 'repositories' ? 'contained' : 'outlined'}
            onClick={() => setContentType('repositories')}
            startIcon={<TrendingIcon />}
          >
            Repositories
          </Button>
          <Button
            variant={contentType === 'organizations' ? 'contained' : 'outlined'}
            onClick={() => setContentType('organizations')}
            startIcon={<PersonIcon />}
          >
            Organizations
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
          {search ? `Search Results (${filteredItems.length})` : contentType === 'repositories' ? 'Community Repositories' : 'Community Organizations'}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {search ? `No results for "${search}"` : 'No items found'}
            </Typography>
            {search && (
              <Button onClick={handleClearSearch} variant="outlined" sx={{ mt: 2 }}>
                Clear Search
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredItems.map(item => (
              <Grid item xs={12} md={6} key={item.id}>
                {contentType === 'repositories' ? (
                  <RepositoryCard repository={item as Repository} onStar={handleStarRepo} />
                ) : (
                  <OrganizationCard organization={item as Organization} />
                )}
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default Discover;