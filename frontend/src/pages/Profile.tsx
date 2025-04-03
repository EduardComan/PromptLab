import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Avatar, 
  Button, 
  Tabs, 
  Tab, 
  Grid, 
  Card, 
  CardContent, 
  Divider, 
  Paper, 
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  Link,
  Stack,
  IconButton,
  Tooltip,
  styled
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Code as CodeIcon, 
  Star as StarIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  Link as LinkIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RepositoryGrid from '../components/Repository/RepositoryGrid';

// Styled components
const StyledBadge = styled(Chip)(({ theme }) => ({
  borderRadius: '8px',
  fontWeight: 500,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  '& .MuiBadge-badge': {
    right: -3,
    top: 13,
    padding: '0 4px',
  },
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 150,
  height: 150,
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: theme.shadows[3],
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    width: 120,
    height: 120,
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.9rem',
  minWidth: 'auto',
  padding: theme.spacing(1, 2),
}));

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  profile_image?: {
    id: string;
  };
  created_at: string;
  is_active: boolean;
  repositories_count: number;
  stars_count: number;
  followers_count: number;
  following_count: number;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon_image?: {
      id: string;
    };
    earned_at: string;
  }>;
}

interface UserRepository {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  stars_count: number;
  owner_user: {
    id: string;
    username: string;
  };
  prompt: {
    id: string;
    title: string;
    description: string | null;
  };
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

interface UserConnection {
  id: string;
  username: string;
  bio: string | null;
  profile_image?: {
    id: string;
  };
  is_following?: boolean; // Only for followers list
}

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [repositories, setRepositories] = useState<UserRepository[]>([]);
  const [starredRepositories, setStarredRepositories] = useState<UserRepository[]>([]);
  const [followers, setFollowers] = useState<UserConnection[]>([]);
  const [following, setFollowing] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!username) return;
      
      try {
        setLoading(true);
        const profileResponse = await api.get(`/accounts/${username}/profile`);
        setProfile(profileResponse.data.profile);
        
        const repositoriesResponse = await api.get(`/accounts/${username}/repositories`);
        setRepositories(repositoriesResponse.data.repositories);
        
        const starredResponse = await api.get(`/accounts/${username}/starred`);
        setStarredRepositories(starredResponse.data.repositories);
        
        const followersResponse = await api.get(`/accounts/${username}/followers`);
        setFollowers(followersResponse.data.followers);
        
        const followingResponse = await api.get(`/accounts/${username}/following`);
        setFollowing(followingResponse.data.following);
        
        // Check if logged-in user is following this profile
        if (user && username !== user.username) {
          const isFollowingResponse = await api.get(`/accounts/${username}/is-followed`);
          setIsFollowing(isFollowingResponse.data.isFollowing);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user profile');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [username, user]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleFollowToggle = async () => {
    if (!profile || !user) return;
    
    try {
      if (isFollowing) {
        await api.delete(`/accounts/${profile.username}/unfollow`);
        setIsFollowing(false);
        if (profile.followers_count > 0) {
          setProfile({
            ...profile,
            followers_count: profile.followers_count - 1
          });
        }
      } else {
        await api.post(`/accounts/${profile.username}/follow`);
        setIsFollowing(true);
        setProfile({
          ...profile,
          followers_count: profile.followers_count + 1
        });
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !profile) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error || 'User not found'}
        </Alert>
      </Container>
    );
  }
  
  const isOwnProfile = user && user.username === profile.username;
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ 
          borderRadius: '12px', 
          overflow: 'hidden', 
          mb: 3,
          position: 'relative'
        }}
      >
        <Box 
          sx={{ 
            height: '150px', 
            backgroundColor: 'primary.main', 
            opacity: 0.8 
          }}
        />
        
        <Box sx={{ p: 3, mt: -8 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ProfileAvatar
                src={profile.profile_image ? `/api/images/${profile.profile_image.id}` : undefined}
                alt={profile.username}
              >
                {profile.username.charAt(0).toUpperCase()}
              </ProfileAvatar>
              
              {profile.full_name && (
                <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 600 }}>
                  {profile.full_name}
                </Typography>
              )}
              
              <Typography 
                variant="h6" 
                align="center" 
                color="primary" 
                gutterBottom
              >
                @{profile.username}
              </Typography>
              
              {profile.bio && (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                  {profile.bio}
                </Typography>
              )}
              
              {!isOwnProfile && user && (
                <Button
                  variant={isFollowing ? 'outlined' : 'contained'}
                  startIcon={isFollowing ? <PersonIcon /> : <AddIcon />}
                  onClick={handleFollowToggle}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
              
              {isOwnProfile && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate('/settings/profile')}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Edit Profile
                </Button>
              )}
              
              <Box sx={{ width: '100%', mt: 2 }}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      New York, NY
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LinkIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                    <Link 
                      href="https://example.com" 
                      target="_blank"
                      variant="body2"
                      sx={{ textDecoration: 'none' }}
                    >
                      example.com
                    </Link>
                  </Box>
                </Stack>
              </Box>

              {profile.badges && profile.badges.length > 0 && (
                <Box sx={{ width: '100%', mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={500} sx={{ mb: 1 }}>
                    Badges
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {profile.badges.map(badge => (
                      <Tooltip key={badge.id} title={badge.description} arrow>
                        <StyledBadge
                          avatar={
                            badge.icon_image ? (
                              <Avatar src={`/api/images/${badge.icon_image.id}`} />
                            ) : undefined
                          }
                          label={badge.name}
                          variant="outlined"
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              )}
              
              <Box sx={{ width: '100%', mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom fontWeight={500} sx={{ mb: 1 }}>
                  Organizations
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Link component={RouterLink} to="/orgs/promptlab">
                        <Avatar 
                          sx={{ width: 48, height: 48, mx: 'auto' }} 
                          alt="PromptLab"
                          src="/logo.png"
                        >
                          P
                        </Avatar>
                      </Link>
                    </Grid>
                    <Grid item xs={4}>
                      <Link component={RouterLink} to="/orgs/ai-collective">
                        <Avatar 
                          sx={{ width: 48, height: 48, mx: 'auto' }} 
                          alt="AI Collective"
                        >
                          A
                        </Avatar>
                      </Link>
                    </Grid>
                    <Grid item xs={4}>
                      <Link component={RouterLink} to="/orgs/view-all">
                        <Avatar 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            mx: 'auto',
                            bgcolor: 'background.default',
                            color: 'text.secondary', 
                            border: '1px dashed',
                            borderColor: 'divider'
                          }}
                        >
                          +
                        </Avatar>
                      </Link>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={9}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ borderRadius: '8px' }}>
                    <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h5" component="div" fontWeight={600} color="primary">
                        {profile.repositories_count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Repositories
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ borderRadius: '8px' }}>
                    <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h5" component="div" fontWeight={600} color="primary">
                        {profile.stars_count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Stars
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ borderRadius: '8px' }}>
                    <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h5" component="div" fontWeight={600} color="primary">
                        {profile.followers_count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Followers
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ borderRadius: '8px' }}>
                    <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h5" component="div" fontWeight={600} color="primary">
                        {profile.following_count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Following
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  aria-label="profile tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <StyledTab icon={<CodeIcon fontSize="small" />} iconPosition="start" label="Repositories" />
                  <StyledTab icon={<StarIcon fontSize="small" />} iconPosition="start" label="Starred" />
                  <StyledTab icon={<PeopleIcon fontSize="small" />} iconPosition="start" label="Followers" />
                  <StyledTab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Following" />
                </Tabs>
              </Box>
              
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {isOwnProfile ? 'Your Repositories' : `${profile.username}'s Repositories`}
                  </Typography>
                  
                  {isOwnProfile && (
                    <Button 
                      variant="contained" 
                      size="small" 
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/new-repository')}
                    >
                      New
                    </Button>
                  )}
                </Box>
                
                {repositories.length === 0 ? (
                  <EmptyState message={`${isOwnProfile ? 'You haven\'t' : `${profile.username} hasn't`} created any repositories yet.`} />
                ) : (
                  <RepositoryGrid repositories={repositories} />
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
                  Starred Repositories
                </Typography>
                
                {starredRepositories.length === 0 ? (
                  <EmptyState message={`${isOwnProfile ? 'You haven\'t' : `${profile.username} hasn't`} starred any repositories yet.`} />
                ) : (
                  <RepositoryGrid repositories={starredRepositories} />
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
                  Followers
                </Typography>
                
                {followers.length === 0 ? (
                  <EmptyState message={`${isOwnProfile ? 'You don\'t' : `${profile.username} doesn't`} have any followers yet.`} />
                ) : (
                  <UserList users={followers} userAction={isOwnProfile ? 'follow' : undefined} />
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={3}>
                <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
                  Following
                </Typography>
                
                {following.length === 0 ? (
                  <EmptyState message={`${isOwnProfile ? 'You aren\'t' : `${profile.username} isn't`} following anyone yet.`} />
                ) : (
                  <UserList users={following} userAction={isOwnProfile ? 'unfollow' : undefined} />
                )}
              </TabPanel>
            </Grid>
          </Grid>
        </Box>
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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

interface UserListProps {
  users: UserConnection[];
  userAction?: 'follow' | 'unfollow';
}

const UserList: React.FC<UserListProps> = ({ users, userAction }) => {
  const navigate = useNavigate();
  const [followStatuses, setFollowStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  
  const handleFollowToggle = async (userId: string, username: string, isCurrentlyFollowing: boolean) => {
    try {
      setLoading(prev => ({ ...prev, [userId]: true }));
      
      if (isCurrentlyFollowing) {
        await api.delete(`/accounts/${username}/unfollow`);
        setFollowStatuses(prev => ({ ...prev, [userId]: false }));
      } else {
        await api.post(`/accounts/${username}/follow`);
        setFollowStatuses(prev => ({ ...prev, [userId]: true }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  // Initialize follow statuses from the users data
  useEffect(() => {
    const statuses: Record<string, boolean> = {};
    users.forEach(user => {
      if (user.is_following !== undefined) {
        statuses[user.id] = user.is_following;
      }
    });
    setFollowStatuses(statuses);
  }, [users]);
  
  return (
    <List>
      {users.map(user => (
        <ListItem 
          key={user.id}
          secondaryAction={
            userAction && (
              <Button
                variant={followStatuses[user.id] ? 'outlined' : 'contained'}
                size="small"
                onClick={() => handleFollowToggle(
                  user.id, 
                  user.username, 
                  !!followStatuses[user.id]
                )}
                disabled={loading[user.id]}
              >
                {followStatuses[user.id] ? 'Unfollow' : 'Follow'}
              </Button>
            )
          }
        >
          <ListItemAvatar>
            <Avatar
              src={user.profile_image ? `/api/images/${user.profile_image.id}` : undefined}
              alt={user.username}
              onClick={() => navigate(`/users/${user.username}`)}
              sx={{ cursor: 'pointer' }}
            >
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography 
                variant="body1" 
                component="span"
                sx={{ cursor: 'pointer', fontWeight: 500 }}
                onClick={() => navigate(`/users/${user.username}`)}
              >
                {user.username}
              </Typography>
            }
            secondary={user.bio}
          />
        </ListItem>
      ))}
    </List>
  );
};

export default Profile; 