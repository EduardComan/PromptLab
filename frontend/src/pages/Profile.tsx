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
  Chip,
  CircularProgress,
  Link as MuiLink,
  AvatarGroup,
  IconButton,
  useMediaQuery,
  useTheme,
  Tooltip,
  Paper,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Star as StarIcon, 
  StarBorder as StarBorderIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  Link as LinkIcon,
  Add as AddIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Organization, User } from '../interfaces';
import AuthService from '../services/AuthService';
import UserService from '../services/UserService';
import RepositoryWideCard from '../components/Repository/RepositoryWideCard';
import RepositoryService from '../services/RepositoryService';
// Import Repository type from RepositoryGrid
import { Repository } from '../components/Repository/RepositoryGrid';

// Tab Panel Component
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

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ py: 5, textAlign: 'center' }}>
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

// Extended User interface to include counts
interface ExtendedUser extends User {
  location?: string;
  website?: string;
  company?: string;
  promptCount?: number;
  starCount?: number;
}

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  stars_count: number;
  owner_user: {
    id: string;
    username: string;
  };
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [profile, setProfile] = useState<ExtendedUser | null>(null);
  const [prompts, setPrompts] = useState<Repository[]>([]);
  const [starredPrompts, setStarredPrompts] = useState<Repository[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        let userData: ExtendedUser | null = null;
        
        // Fetch user profile data
        if (username) {
          try {
            // API endpoint: GET /api/accounts/user/:username
            const userResponse = await api.get(`/accounts/user/${username}`);
            userData = userResponse.data.user || userResponse.data;
          } catch (userError) {
            console.error('Error fetching user profile:', userError);
            throw new Error('Could not load user profile');
          }
        } else if (user) {
          // Use current user's profile
          userData = user as ExtendedUser;
        } else {
          throw new Error('No username provided and no user logged in');
        }
        
        if (!userData) {
          throw new Error('Failed to retrieve user data');
        }
        
        // Set defaults for counts
        userData.promptCount = 0;
        userData.starCount = 0;
        
        // Fetch user's repositories
        try {
          // API endpoint: GET /api/repositories/user/:username or GET /api/repositories?username=:username
          const repoUrl = username 
            ? `/repositories/user/${username}` 
            : '/repositories?username=' + userData.username;
          
          const response = await api.get(repoUrl);
          const repositories = response.data.repositories || [];
          
          // Convert API response to Repository type
          const formattedRepos: Repository[] = repositories.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            description: repo.description,
            is_public: repo.is_public,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            stars_count: repo.stars_count || 0,
            owner_user: repo.owner_user,
            owner_org: repo.owner_org,
            isStarred: repo.isStarred || false,
            tags: repo.tags
          }));
          
          setPrompts(formattedRepos);
          userData.promptCount = repositories.length;
        } catch (repoError) {
          console.error('Error fetching repositories:', repoError);
          // Don't fail the whole profile load if repos fail
          setPrompts([]);
        }
        
        // Fetch user's starred repositories
        try {
          // API endpoint: GET /api/accounts/user/:username/starred or GET /api/accounts/me/starred
          const starredUrl = username 
            ? `/accounts/user/${username}/starred` 
            : '/accounts/me/starred';
          
          const starredResponse = await api.get(starredUrl);
          const starredRepos = starredResponse.data.repositories || [];
          
          // Convert API response to Repository type
          const formattedStarredRepos: Repository[] = starredRepos.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            description: repo.description,
            is_public: repo.is_public,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            stars_count: repo.stars_count || 0,
            owner_user: repo.owner_user,
            owner_org: repo.owner_org,
            isStarred: true, // These are explicitly starred
            tags: repo.tags
          }));
          
          setStarredPrompts(formattedStarredRepos);
          userData.starCount = starredRepos.length;
        } catch (starError) {
          console.error('Error fetching starred repositories:', starError);
          // Don't fail the whole profile load if starred repos fail
          setStarredPrompts([]);
        }
        
        // Fetch user's organizations
        try {
          if (isAuthenticated && (!username || username === user?.username)) {
            // If viewing own profile, get organizations from /organizations/me
            // API endpoint: GET /api/organizations/me
            const orgsResponse = await api.get('/organizations/me');
            setOrganizations(orgsResponse.data.organizations || []);
          } else if (username) {
            // If viewing someone else's profile, use the filter query parameter
            // API endpoint: GET /api/organizations with query parameter
            const orgsResponse = await api.get(`/organizations?username=${username}`);
            setOrganizations(orgsResponse.data.organizations || []);
          }
        } catch (orgError) {
          console.error('Error fetching organizations:', orgError);
          // Don't fail the whole profile load if orgs fail
          setOrganizations([]);
        }
        
        setProfile(userData);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to load user profile');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [username, user, isAuthenticated]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStarToggle = async (repoId: string, isStarred: boolean) => {
    try {
      // Call the appropriate service method
      if (isStarred) {
        await RepositoryService.unstarRepository(repoId);
        setSnackbar({
          open: true,
          message: 'Repository removed from your starred repositories',
          severity: 'success'
        });
      } else {
        await RepositoryService.starRepository(repoId);
        setSnackbar({
          open: true,
          message: 'Repository added to your starred repositories',
          severity: 'success'
        });
      }
      
      // Update both repositories lists to reflect the change
      setPrompts(repos => 
        repos.map(repo => 
          repo.id === repoId 
            ? { 
                ...repo, 
                isStarred: !isStarred,
                stars_count: (repo.stars_count || 0) + (isStarred ? -1 : 1) 
              } 
            : repo
        )
      );
      
      // For starred repos list, either remove the unstarred repo or update the starred one
      if (isStarred) {
        // Remove from starred list if unstarred
        setStarredPrompts(repos => repos.filter(repo => repo.id !== repoId));
      } else {
        // Update in starred list if it exists there
        setStarredPrompts(repos => {
          const repoExists = repos.some(repo => repo.id === repoId);
          if (repoExists) {
            return repos.map(repo => 
              repo.id === repoId 
                ? { 
                    ...repo, 
                    isStarred: true,
                    stars_count: (repo.stars_count || 0) + 1 
                  } 
                : repo
            );
          } else {
            // Add the newly starred repo to the starred list
            const repoToAdd = prompts.find(repo => repo.id === repoId);
            if (repoToAdd) {
              return [...repos, { 
                ...repoToAdd, 
                isStarred: true,
                stars_count: (repoToAdd.stars_count || 0) + 1 
              }];
            }
            return repos;
          }
        });
      }
      
      // Update the profile star count if it's the user's profile
      if (!username || (user && username === user.username)) {
        setProfile(prev => {
          if (prev) {
            return {
              ...prev,
              starCount: isStarred 
                ? Math.max((prev.starCount || 0) - 1, 0) 
                : (prev.starCount || 0) + 1
            };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update starred status. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !profile) {
    return (
      <Box sx={{ py: 3 }}>
        <Typography color="error">{error || 'User not found'}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        width: '100%',
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <Container 
        maxWidth="xl" 
        sx={{ 
          py: 4,
          px: { xs: 2, sm: 3 },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Profile Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            pb: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            mb: 3,
            gap: { xs: 2, md: 5 },
            maxWidth: '100%',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Left side with avatar and details */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: { xs: 'center', md: 'flex-start' },
              width: { xs: '100%', md: '30%' },
              minWidth: { md: '250px' },
              maxWidth: { xs: '100%', md: '320px' },
              flexShrink: 0,
              mx: { xs: 'auto', md: 0 },
            }}
          >
            <Avatar
              src={profile.profile_image_id ? `/api/accounts/profile-image/${profile.profile_image_id}` : 
                   profile.picture_url || undefined}
              alt={profile.username}
              sx={{ 
                width: 130, 
                height: 130,
                mb: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {profile.username[0].toUpperCase()}
            </Avatar>
            
            {/* Edit Profile button - only show if viewing own profile */}
            {isAuthenticated && (!username || (user && username === user.username)) && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                component={Link}
                to="/profile/edit"
                size="small"
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 2,
                  py: 0.5
                }}
              >
                Edit Profile
              </Button>
            )}
            
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {profile.full_name || profile.username}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              @{profile.username}
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, mb: 3, maxWidth: '100%' }}>
              {profile.bio || 'No bio provided'}
            </Typography>
            <Box sx={{ mt: 1, mb: 3, width: '100%' }}>
              {profile.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <LocationIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {profile.location}
                  </Typography>
                </Box>
              )}
              {profile.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LinkIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                  <MuiLink 
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: 'primary.main', textDecoration: 'none' }}
                  >
                    {profile.website.replace(/^(https?:\/\/)?(www\.)?/, '')}
                  </MuiLink>
                </Box>
              )}
            </Box>
            
            {/* Organizations Section */}
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="h6" sx={{ 
                mb: 2, 
                fontWeight: 600, 
                borderBottom: '1px solid', 
                borderColor: 'divider',
                pb: 1,
              }}>
                Organizations
              </Typography>
              {organizations.length > 0 ? (
                <AvatarGroup 
                  max={6} 
                  sx={{ 
                    justifyContent: 'center',
                    '& .MuiAvatar-root': { 
                      width: 40, 
                      height: 40, 
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  {organizations.map((org) => (
                    <Tooltip key={org.id} title={org.name}>
                      <Avatar
                        component={Link}
                        to={`/organizations/${org.name}`}
                        alt={org.name}
                        src={org.logo_image_id ? `/api/images/${org.logo_image_id}` : undefined}
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'scale(1.1)' }
                        }}
                      >
                        {org.name[0].toUpperCase()}
                      </Avatar>
                    </Tooltip>
                  ))}
                  {isAuthenticated && (!username || (user && username === user.username)) && (
                    <Tooltip title="Join or create organization">
                      <Avatar
                        component={Link}
                        to="/organizations"
                        sx={{ 
                          cursor: 'pointer',
                          bgcolor: 'background.paper',
                          color: 'primary.main',
                          border: '1px dashed',
                          borderColor: 'primary.main',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'primary.main', 
                            color: 'white',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <AddIcon />
                      </Avatar>
                    </Tooltip>
                  )}
                </AvatarGroup>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isAuthenticated && (!username || (user && username === user.username)) ? (
                    <Button
                      component={Link}
                      to="/organizations"
                      startIcon={<AddIcon />}
                      variant="outlined"
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      Join organization
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No organizations
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>
          
          {/* Right side with tabs and content */}
          <Box sx={{ 
            flexGrow: 1,
            width: { xs: '100%', md: 'calc(70% - 5px)' },
            overflow: 'hidden',
            minWidth: 0, // This is crucial for flexbox to allow children to shrink below their content size
          }}>
            {/* Tabs */}
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                mb: 2,
                borderBottom: 1, 
                borderColor: 'divider',
                '& .MuiTabs-flexContainer': {
                  flexWrap: isMobile ? 'wrap' : 'nowrap',
                },
              }}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : undefined}
            >
              <Tab 
                label={`Repositories ${profile.promptCount}`} 
                sx={{ textTransform: 'none', fontWeight: 500 }} 
              />
              <Tab 
                label={`Starred ${profile.starCount}`} 
                sx={{ textTransform: 'none', fontWeight: 500 }} 
              />
            </Tabs>

            {/* Repositories Tab */}
            <TabPanel value={tabValue} index={0}>
              {prompts.length > 0 ? (
                <Grid container spacing={3}>
                  {prompts.map((repository) => (
                    <Grid item xs={12} key={repository.id}>
                      <RepositoryWideCard 
                        repository={repository} 
                        onStar={handleStarToggle}
                        profileImage={profile.profile_image_id ? 
                          `/api/accounts/profile-image/${profile.profile_image_id}` : undefined}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 6,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    No repositories found
                  </Typography>
                </Box>
              )}
            </TabPanel>

            {/* Starred Tab */}
            <TabPanel value={tabValue} index={1}>
              {starredPrompts.length > 0 ? (
                <Grid container spacing={3}>
                  {starredPrompts.map((repository) => (
                    <Grid item xs={12} key={repository.id}>
                      <RepositoryWideCard 
                        repository={repository} 
                        onStar={handleStarToggle}
                        profileImage={profile.profile_image_id ? 
                          `/api/accounts/profile-image/${profile.profile_image_id}` : undefined}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 6,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    No starred repositories
                  </Typography>
                </Box>
              )}
            </TabPanel>
          </Box>
        </Box>
      </Container>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile; 