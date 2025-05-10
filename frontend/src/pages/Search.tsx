import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Button,
  Tabs,
  Tab,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Alert,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  Tag as TagIcon,
  Business as BusinessIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import RepositoryGrid from '../components/Repository/RepositoryGrid';
import { useAuth } from '../contexts/AuthContext';

interface SearchState {
  query: string;
  repositories: any[];
  users: any[];
  organizations: any[];
  tags: any[];
  loading: boolean;
  error: string | null;
}

const Search: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get query from URL params
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  const initialTab = queryParams.get('tab') || '0';
  
  const [searchState, setSearchState] = useState<SearchState>({
    query: initialQuery,
    repositories: [],
    users: [],
    organizations: [],
    tags: [],
    loading: false,
    error: null
  });
  
  const [tabValue, setTabValue] = useState(parseInt(initialTab));
  const [inputQuery, setInputQuery] = useState(initialQuery);
  
  useEffect(() => {
    if (searchState.query) {
      performSearch(searchState.query);
    }
  }, [searchState.query]);
  
  useEffect(() => {
    // Update the query when URL changes
    const queryFromUrl = queryParams.get('q') || '';
    if (queryFromUrl !== searchState.query) {
      setSearchState(prev => ({ ...prev, query: queryFromUrl }));
      setInputQuery(queryFromUrl);
    }
    
    // Update the tab when URL changes
    const tabFromUrl = queryParams.get('tab') || '0';
    if (parseInt(tabFromUrl) !== tabValue) {
      setTabValue(parseInt(tabFromUrl));
    }
  }, [location.search]);
  
  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setSearchState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
      
      setSearchState(prev => ({
        ...prev,
        repositories: response.data.repositories || [],
        users: response.data.users || [],
        organizations: response.data.organizations || [],
        tags: response.data.tags || [],
        loading: false
      }));
    } catch (err) {
      console.error('Error performing search:', err);
      setSearchState(prev => ({
        ...prev,
        loading: false,
        error: 'An error occurred while searching. Please try again.'
      }));
    }
  };
  
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Update URL with new search query
    navigate(`/search?q=${encodeURIComponent(inputQuery)}&tab=${tabValue}`);
    
    // Update state
    setSearchState(prev => ({ ...prev, query: inputQuery }));
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Update URL to include tab
    navigate(`/search?q=${encodeURIComponent(searchState.query)}&tab=${newValue}`);
  };
  
  const handleTagClick = (tag: string) => {
    setInputQuery(tag);
    navigate(`/search?q=${encodeURIComponent(tag)}&tab=3`);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSearch}>
          <Typography variant="h5" component="h1" gutterBottom>
            Search
          </Typography>
          
          <Box sx={{ display: 'flex', mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search for repositories, users, organizations, tags..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              sx={{ mr: 1 }}
            />
            <Button 
              type="submit" 
              variant="contained"
              disabled={!inputQuery.trim() || searchState.loading}
            >
              {searchState.loading ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Box>
        </Box>
        
        {searchState.query && (
          <>
            <Divider sx={{ mb: 2 }} />
            
            <Box>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                aria-label="search results tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab icon={<CodeIcon />} iconPosition="start" label={`Repositories (${searchState.repositories.length})`} />
                <Tab icon={<PersonIcon />} iconPosition="start" label={`Users (${searchState.users.length})`} />
                <Tab icon={<BusinessIcon />} iconPosition="start" label={`Organizations (${searchState.organizations.length})`} />
                <Tab icon={<TagIcon />} iconPosition="start" label={`Tags (${searchState.tags.length})`} />
              </Tabs>
              
              <Box sx={{ mt: 3 }}>
                {searchState.loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                  </Box>
                ) : searchState.error ? (
                  <Typography color="error" sx={{ py: 2 }}>
                    {searchState.error}
                  </Typography>
                ) : (
                  <>
                    <TabPanel value={tabValue} index={0}>
                      {searchState.repositories.length > 0 ? (
                        <RepositoryGrid 
                          repositories={searchState.repositories} 
                          emptyMessage="No repositories found matching your search."
                        />
                      ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                          No repositories found matching your search.
                        </Typography>
                      )}
                    </TabPanel>
                    
                    <TabPanel value={tabValue} index={1}>
                      {searchState.users.length > 0 ? (
                        <UserGrid users={searchState.users} />
                      ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                          No users found matching your search.
                        </Typography>
                      )}
                    </TabPanel>
                    
                    <TabPanel value={tabValue} index={2}>
                      {searchState.organizations.length > 0 ? (
                        <OrganizationGrid organizations={searchState.organizations} />
                      ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                          No organizations found matching your search.
                        </Typography>
                      )}
                    </TabPanel>
                    
                    <TabPanel value={tabValue} index={3}>
                      {searchState.tags.length > 0 ? (
                        <TagGrid tags={searchState.tags} onTagClick={handleTagClick} />
                      ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                          No tags found matching your search.
                        </Typography>
                      )}
                    </TabPanel>
                  </>
                )}
              </Box>
            </Box>
          </>
        )}
      </Paper>
      
      {!searchState.query && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Search for prompts, repositories, users, and more
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter keywords, usernames, repository names, or tags to find what you're looking for.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface UserGridProps {
  users: Array<{
    id: string;
    username: string;
    bio: string | null;
    profile_image?: {
      id: string;
    };
    repositories_count: number;
    followers_count: number;
  }>;
}

const UserGrid: React.FC<UserGridProps> = ({ users }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [followStatuses, setFollowStatuses] = useState<Record<string, boolean>>({});
  
  const handleFollowToggle = async (userId: string, username: string, isCurrentlyFollowing: boolean) => {
    try {
      if (isCurrentlyFollowing) {
        await api.delete(`/accounts/${username}/unfollow`);
        setFollowStatuses(prev => ({ ...prev, [userId]: false }));
      } else {
        await api.post(`/accounts/${username}/follow`);
        setFollowStatuses(prev => ({ ...prev, [userId]: true }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };
  
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUser) return;
      
      const statuses: Record<string, boolean> = {};
      
      // For each user, check if the current user is following them
      for (const user of users) {
        if (user.id !== currentUser.id) {
          try {
            const response = await api.get(`/accounts/${user.username}/is-followed`);
            statuses[user.id] = response.data.isFollowing;
          } catch (err) {
            console.error(`Error checking follow status for ${user.username}:`, err);
          }
        }
      }
      
      setFollowStatuses(statuses);
    };
    
    checkFollowStatus();
  }, [users, currentUser]);
  
  return (
    <Grid container spacing={3}>
      {users.map(user => (
        <Grid item xs={12} sm={6} md={4} key={user.id}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={user.profile_image ? `/api/images/${user.profile_image.id}` : undefined}
                alt={user.username}
                sx={{ width: 50, height: 50, mr: 2 }}
                onClick={() => navigate(`/users/${user.username}`)}
                style={{ cursor: 'pointer' }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography 
                  variant="h6" 
                  component="h2"
                  onClick={() => navigate(`/users/${user.username}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {user.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.repositories_count} repositories · {user.followers_count} followers
                </Typography>
              </Box>
            </Box>
            
            {user.bio && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                {user.bio}
              </Typography>
            )}
            
            {currentUser && currentUser.id !== user.id && (
              <Button
                variant={followStatuses[user.id] ? 'outlined' : 'contained'}
                size="small"
                fullWidth
                onClick={() => handleFollowToggle(user.id, user.username, !!followStatuses[user.id])}
              >
                {followStatuses[user.id] ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

interface OrganizationGridProps {
  organizations: Array<{
    id: string;
    name: string;
    description: string | null;
    logo_image?: {
      id: string;
    };
    repositories_count: number;
    members_count: number;
  }>;
}

const OrganizationGrid: React.FC<OrganizationGridProps> = ({ organizations }) => {
  const navigate = useNavigate();
  
  return (
    <Grid container spacing={3}>
      {organizations.map(org => (
        <Grid item xs={12} sm={6} md={4} key={org.id}>
          <Paper 
            sx={{ 
              p: 2,
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={org.logo_image ? `/api/images/${org.logo_image.id}` : undefined}
                alt={org.name}
                sx={{ width: 50, height: 50, mr: 2 }}
              >
                {org.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" component="h2">
                  {org.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {org.repositories_count} repositories · {org.members_count} members
                </Typography>
              </Box>
            </Box>
            
            {org.description && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                {org.description}
              </Typography>
            )}
            
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<BusinessIcon />}
              onClick={() => navigate(`/organizations/${org.name}`)}
              sx={{ mt: 1 }}
            >
              View Organization Profile
            </Button>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

interface TagGridProps {
  tags: Array<{
    id: string;
    name: string;
    repositories_count: number;
  }>;
  onTagClick: (tag: string) => void;
}

const TagGrid: React.FC<TagGridProps> = ({ tags, onTagClick }) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {tags.map(tag => (
        <Chip
          key={tag.id}
          label={`${tag.name} (${tag.repositories_count})`}
          onClick={() => onTagClick(tag.name)}
          clickable
          color="primary"
          variant="outlined"
          sx={{ m: 0.5 }}
        />
      ))}
    </Box>
  );
};

export default Search; 