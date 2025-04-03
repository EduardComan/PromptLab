import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button, 
  Avatar, 
  TextField, 
  InputAdornment, 
  Chip,
  Paper,
  Divider,
  IconButton,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Star as StarIcon, 
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Code as CodeIcon,
  LocalFireDepartment as TrendingIcon,
  Bookmark as BookmarkIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Repository {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  owner_user?: {
    id: string;
    username: string;
    profile_image?: {
      id: string;
    };
  };
  owner_org?: {
    id: string;
    name: string;
    logo_image?: {
      id: string;
    };
  };
  prompt: {
    id: string;
    title: string;
    description: string;
  };
  created_at: string;
  star_count: number;
  tags: Array<{ id: string; name: string }>;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingRepos, setTrendingRepos] = useState<Repository[]>([]);
  const [recentRepos, setRecentRepos] = useState<Repository[]>([]);
  const [followingRepos, setFollowingRepos] = useState<Repository[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch trending repositories
        const trendingResponse = await api.get('/repositories/trending');
        setTrendingRepos(trendingResponse.data.repositories);
        
        // Fetch recent repositories
        const recentResponse = await api.get('/repositories/recent');
        setRecentRepos(recentResponse.data.repositories);
        
        // Fetch repositories from followed users if logged in
        if (user) {
          const followingResponse = await api.get('/repositories/following');
          setFollowingRepos(followingResponse.data.repositories);
        }
      } catch (error) {
        console.error('Error fetching repositories:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Hero section with search */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 5, 
          textAlign: 'center',
          backgroundImage: 'linear-gradient(135deg, #1976d2 0%, #512da8 100%)',
          color: 'white'
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          PromptLab
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Discover, share, and collaborate on AI prompts
        </Typography>
        
        <Box 
          component="form" 
          onSubmit={handleSearch}
          sx={{ 
            mt: 3, 
            width: '100%', 
            maxWidth: 600, 
            mx: 'auto',
            display: 'flex'
          }}
        >
          <TextField
            fullWidth
            placeholder="Search for prompts, tags, or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            sx={{ 
              bgcolor: 'white', 
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px 0 0 4px',
              }
            }}
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
            sx={{ 
              bgcolor: '#f5f5f5', 
              color: '#333',
              '&:hover': {
                bgcolor: '#e0e0e0',
              },
              borderRadius: '0 4px 4px 0',
            }}
          >
            Search
          </Button>
        </Box>
      </Paper>
      
      {/* Repository browser */}
      <Box sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="repository tabs"
          sx={{ mb: 2 }}
        >
          <Tab icon={<TrendingIcon />} iconPosition="start" label="Trending" />
          <Tab icon={<CodeIcon />} iconPosition="start" label="Recent" />
          {user && <Tab icon={<PersonIcon />} iconPosition="start" label="Following" />}
        </Tabs>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <TabPanel value={tabValue} index={0}>
              <RepositoryGrid repositories={trendingRepos} />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <RepositoryGrid repositories={recentRepos} />
            </TabPanel>
            {user && (
              <TabPanel value={tabValue} index={2}>
                {followingRepos.length > 0 ? (
                  <RepositoryGrid repositories={followingRepos} />
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      Repositories from users you follow will appear here.
                    </Typography>
                    <Button 
                      variant="contained" 
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/discover/users')}
                    >
                      Discover Users to Follow
                    </Button>
                  </Paper>
                )}
              </TabPanel>
            )}
          </Box>
        )}
      </Box>
      
      {/* Call to action */}
      <Paper sx={{ p: 4, mb: 5, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Ready to create your own prompts?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Create a repository and start crafting powerful AI prompts with version control, collaboration, and testing features.
        </Typography>
        <Button 
          variant="contained" 
          size="large"
          onClick={() => navigate(user ? '/repositories/new' : '/login')}
        >
          {user ? 'Create Repository' : 'Sign In to Get Started'}
        </Button>
      </Paper>
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
      id={`repository-tabpanel-${index}`}
      aria-labelledby={`repository-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface RepositoryGridProps {
  repositories: Repository[];
}

const RepositoryGrid: React.FC<RepositoryGridProps> = ({ repositories }) => {
  const navigate = useNavigate();
  
  if (repositories.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No repositories found.
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Grid container spacing={3}>
      {repositories.map((repo) => (
        <Grid item xs={12} sm={6} md={4} key={repo.id}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  src={
                    repo.owner_user?.profile_image 
                      ? `/api/images/${repo.owner_user.profile_image.id}` 
                      : repo.owner_org?.logo_image 
                      ? `/api/images/${repo.owner_org.logo_image.id}`
                      : undefined
                  }
                  sx={{ width: 24, height: 24, mr: 1 }}
                >
                  {repo.owner_user 
                    ? repo.owner_user.username.charAt(0).toUpperCase() 
                    : repo.owner_org?.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  {repo.owner_user?.username || repo.owner_org?.name}
                </Typography>
              </Box>
              
              <Typography variant="h6" component="h2" gutterBottom noWrap>
                {repo.name}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
                {repo.description || repo.prompt.description || 'No description available'}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {repo.tags && repo.tags.slice(0, 3).map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tags/${tag.name}`);
                    }}
                  />
                ))}
                {repo.tags && repo.tags.length > 3 && (
                  <Chip
                    label={`+${repo.tags.length - 3}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <StarIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5, mr: 2 }}>
                  {repo.star_count}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {repo.is_public ? (
                    <VisibilityIcon fontSize="small" color="action" />
                  ) : (
                    <BookmarkIcon fontSize="small" color="action" />
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    {repo.is_public ? 'Public' : 'Private'}
                  </Typography>
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  {formatDistanceToNow(new Date(repo.created_at), { addSuffix: true })}
                </Typography>
              </Box>
            </CardContent>
            
            <Divider />
            
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate(`/repositories/${repo.id}`)}
                sx={{ width: '100%' }}
              >
                View Prompt
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default Home; 