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
  Alert
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Code as CodeIcon, 
  Star as StarIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RepositoryGrid from '../components/Repository/RepositoryGrid';

interface UserProfile {
  id: string;
  username: string;
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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
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
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: { xs: 'center', md: 'flex-start' }, 
            mr: { md: 4 }, 
            mb: { xs: 3, md: 0 },
            minWidth: { md: '250px' }
          }}>
            <Avatar
              src={profile.profile_image ? `/api/images/${profile.profile_image.id}` : undefined}
              alt={profile.username}
              sx={{ width: 120, height: 120, mb: 2 }}
            >
              {profile.username.charAt(0).toUpperCase()}
            </Avatar>
            
            <Typography variant="h5" component="h1" gutterBottom>
              {profile.username}
            </Typography>
            
            {profile.bio && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {profile.bio}
              </Typography>
            )}
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
            </Typography>
            
            {!isOwnProfile && user && (
              <Button
                variant={isFollowing ? 'outlined' : 'contained'}
                startIcon={isFollowing ? <PersonIcon /> : <AddIcon />}
                onClick={handleFollowToggle}
                sx={{ mt: 2 }}
                fullWidth
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
            
            {isOwnProfile && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate('/settings/profile')}
                sx={{ mt: 2 }}
                fullWidth
              >
                Edit Profile
              </Button>
            )}
            
            {profile.badges && profile.badges.length > 0 && (
              <Box sx={{ mt: 3, width: '100%' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Badges
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.badges.map(badge => (
                    <Tooltip key={badge.id} title={badge.description}>
                      <Chip
                        avatar={
                          badge.icon_image ? (
                            <Avatar src={`/api/images/${badge.icon_image.id}`} />
                          ) : undefined
                        }
                        label={badge.name}
                        variant="outlined"
                        size="small"
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
          
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
          <Divider sx={{ my: 2, display: { xs: 'block', md: 'none' } }} />
          
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h5" component="div">
                      {profile.repositories_count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Repositories
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h5" component="div">
                      {profile.stars_count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stars
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h5" component="div">
                      {profile.followers_count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Followers
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h5" component="div">
                      {profile.following_count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Following
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="profile tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab icon={<CodeIcon />} iconPosition="start" label="Repositories" />
                <Tab icon={<StarIcon />} iconPosition="start" label="Starred" />
                <Tab icon={<PeopleIcon />} iconPosition="start" label="Followers" />
                <Tab icon={<PersonIcon />} iconPosition="start" label="Following" />
              </Tabs>
              
              <TabPanel value={tabValue} index={0}>
                {repositories.length === 0 ? (
                  <EmptyState message={`${isOwnProfile ? 'You haven\'t' : `${profile.username} hasn't`} created any repositories yet.`} />
                ) : (
                  <RepositoryGrid repositories={repositories} />
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                {starredRepositories.length === 0 ? (
                  <EmptyState message={`${isOwnProfile ? 'You haven\'t' : `${profile.username} hasn't`} starred any repositories yet.`} />
                ) : (
                  <RepositoryGrid repositories={starredRepositories} />
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={2}>
                {followers.length === 0 ? (
                  <EmptyState message={`${isOwnProfile ? 'You don\'t' : `${profile.username} doesn't`} have any followers yet.`} />
                ) : (
                  <UserList users={followers} userAction={isOwnProfile ? 'follow' : undefined} />
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={3}>
                {following.length === 0 ? (
                  <EmptyState message={`${isOwnProfile ? 'You aren\'t' : `${profile.username} isn't`} following anyone yet.`} />
                ) : (
                  <UserList users={following} userAction={isOwnProfile ? 'unfollow' : undefined} />
                )}
              </TabPanel>
            </Box>
          </Box>
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
                sx={{ cursor: 'pointer' }}
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

const Tooltip: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div title={title}>
      {children}
    </div>
  );
};

export default Profile; 