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
  Paper
} from '@mui/material';
import { 
  Star as StarIcon, 
  StarBorder as StarBorderIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  Link as LinkIcon,
  Add as AddIcon,
  Public as PublicIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Organization, User, Repository } from '../interfaces';
import AuthService from '../services/AuthService';
import UserService from '../services/UserService';

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
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [starredPrompts, setStarredPrompts] = useState<Prompt[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
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
          setPrompts(repositories);
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
          setStarredPrompts(starredRepos);
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
                mb: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {profile.username[0].toUpperCase()}
            </Avatar>
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
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ color: 'primary.main', textDecoration: 'none' }}
                  >
                    {profile.website.replace(/^https?:\/\//, '')}
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
                // textAlign: { xs: 'center', md: 'left' }
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
                    <Tooltip key={org.id} title={org.display_name}>
                      <Avatar
                        component={Link}
                        to={`/organizations/${org.name}`}
                        alt={org.display_name}
                        src={org.logo_image_id ? `/api/organizations/logo/${org.logo_image_id}` : 
                             org.logo_url || undefined}
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'scale(1.1)' }
                        }}
                      >
                        {org.display_name[0].toUpperCase()}
                      </Avatar>
                    </Tooltip>
                  ))}
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
                </AvatarGroup>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
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
                label={`Prompts ${profile.promptCount}`} 
                sx={{ textTransform: 'none', fontWeight: 500 }} 
              />
              <Tab 
                label={`Starred ${profile.starCount}`} 
                sx={{ textTransform: 'none', fontWeight: 500 }} 
              />
            </Tabs>

            {/* Prompts Tab */}
            <TabPanel value={tabValue} index={0}>
              {prompts.length > 0 ? (
                <Grid container spacing={3} sx={{ width: '100%', m: 0 }}>
                  {prompts.map((prompt) => (
                    <Grid item xs={12} key={prompt.id} sx={{ px: { xs: 0, sm: 1.5 } }}>
                      <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
                        border: '1px solid', 
                        borderColor: 'divider',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          borderColor: 'primary.light',
                          transition: 'all 0.3s ease'
                        },
                        width: '100%',
                      }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                          {/* Title and Description */}
                          <Link 
                            to={`/repositories/${prompt.id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <Typography 
                              variant="h5" 
                              sx={{ 
                                fontWeight: 700,
                                mb: 1.5,
                                color: 'text.primary',
                                '&:hover': { color: 'primary.main' },
                                fontSize: { xs: '1.25rem', md: '1.5rem' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {prompt.title}
                            </Typography>
                          </Link>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 2.5,
                              fontSize: '0.95rem',
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              overflow: 'hidden',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 2,
                            }}
                          >
                            {prompt.description || 'No description provided'}
                          </Typography>
                          
                          {/* Tags */}
                          {prompt.tags && prompt.tags.length > 0 && (
                            <Box sx={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: 1, 
                              mb: 2.5,
                              maxWidth: '100%',
                              overflow: 'hidden',
                            }}>
                              {prompt.tags.map(tag => (
                                <Chip 
                                  key={tag.id} 
                                  label={tag.name} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ 
                                    borderRadius: '16px',
                                    maxWidth: '100%',
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                          
                          {/* Footer - metadata */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            rowGap: 2,
                            width: '100%',
                          }}>
                            {/* User Info */}
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              minWidth: 0,
                              maxWidth: '70%',
                            }}>
                              <Avatar 
                                sx={{ width: 28, height: 28, mr: 1, flexShrink: 0 }}
                                alt={prompt.owner_user.username}
                                src={prompt.owner_user.id === profile.id && profile.profile_image_id ? 
                                  `/api/accounts/profile-image/${profile.profile_image_id}` : undefined}
                              >
                                {prompt.owner_user.username[0].toUpperCase()}
                              </Avatar>
                              <Typography 
                                variant="body2" 
                                component="span" 
                                sx={{ 
                                  mr: 2,
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {prompt.owner_user.username}
                              </Typography>
                              
                              {/* Visibility Badge */}
                              <Chip 
                                icon={prompt.is_public ? <PublicIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                                size="small"
                                label={prompt.is_public ? "Public" : "Private"}
                                color={prompt.is_public ? "success" : "default"}
                                variant="outlined"
                                sx={{ 
                                  height: 24,
                                  borderRadius: 3,
                                  fontSize: '0.75rem',
                                  flexShrink: 0,
                                }}
                              />
                            </Box>
                            
                            {/* Right side metadata */}
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: { xs: 1, sm: 2 },
                              color: 'text.secondary',
                              fontSize: '0.875rem',
                              flexShrink: 0,
                            }}>
                              {/* Star count */}
                              {prompt.is_public && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  gap: 0.5
                                }}>
                                  {prompt.stars_count > 0 ? (
                                    <StarIcon fontSize="small" sx={{ color: '#f1c40f' }} />
                                  ) : (
                                    <StarBorderIcon fontSize="small" />
                                  )}
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: prompt.stars_count > 0 ? 600 : 400
                                    }}
                                  >
                                    {prompt.stars_count}
                                  </Typography>
                                </Box>
                              )}
                              
                              {/* Creation date */}
                              <Typography 
                                variant="body2"
                                sx={{
                                  display: { xs: 'none', sm: 'block' }
                                }}
                              >
                                {format(new Date(prompt.created_at), 'MMM d, yyyy')}
                              </Typography>
                              <Typography 
                                variant="body2"
                                sx={{
                                  display: { xs: 'block', sm: 'none' }
                                }}
                              >
                                {format(new Date(prompt.created_at), 'MM/dd/yy')}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <EmptyState message="No prompts found" />
              )}
            </TabPanel>

            {/* Starred Tab - Apply the same responsive fixes from above */}
            <TabPanel value={tabValue} index={1}>
              {starredPrompts.length > 0 ? (
                <Grid container spacing={3} sx={{ width: '100%', m: 0 }}>
                  {starredPrompts.map((prompt) => (
                    <Grid item xs={12} key={prompt.id} sx={{ px: { xs: 0, sm: 1.5 } }}>
                      <Card sx={{ 
                        borderRadius: 2, 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
                        border: '1px solid', 
                        borderColor: 'divider',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          borderColor: 'primary.light',
                          transition: 'all 0.3s ease'
                        },
                        width: '100%',
                      }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                          {/* Title and Description */}
                          <Link 
                            to={`/repositories/${prompt.id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <Typography 
                              variant="h5" 
                              sx={{ 
                                fontWeight: 700,
                                mb: 1.5,
                                color: 'text.primary',
                                '&:hover': { color: 'primary.main' },
                                fontSize: { xs: '1.25rem', md: '1.5rem' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {prompt.title}
                            </Typography>
                          </Link>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 2.5,
                              fontSize: '0.95rem',
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              overflow: 'hidden',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 2,
                            }}
                          >
                            {prompt.description || 'No description provided'}
                          </Typography>
                          
                          {/* Tags */}
                          {prompt.tags && prompt.tags.length > 0 && (
                            <Box sx={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: 1, 
                              mb: 2.5,
                              maxWidth: '100%',
                              overflow: 'hidden',
                            }}>
                              {prompt.tags.map(tag => (
                                <Chip 
                                  key={tag.id} 
                                  label={tag.name} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ 
                                    borderRadius: '16px',
                                    maxWidth: '100%',
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                          
                          {/* Footer - metadata */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            rowGap: 2,
                            width: '100%',
                          }}>
                            {/* User Info */}
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              minWidth: 0,
                              maxWidth: '70%',
                            }}>
                              <Avatar 
                                sx={{ width: 28, height: 28, mr: 1, flexShrink: 0 }}
                                alt={prompt.owner_user.username}
                              >
                                {prompt.owner_user.username[0].toUpperCase()}
                              </Avatar>
                              <Typography 
                                variant="body2" 
                                component="span" 
                                sx={{ 
                                  mr: 2,
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {prompt.owner_user.username}
                              </Typography>
                              
                              {/* Visibility Badge */}
                              <Chip 
                                icon={prompt.is_public ? <PublicIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                                size="small"
                                label={prompt.is_public ? "Public" : "Private"}
                                color={prompt.is_public ? "success" : "default"}
                                variant="outlined"
                                sx={{ 
                                  height: 24,
                                  borderRadius: 3,
                                  fontSize: '0.75rem',
                                  flexShrink: 0,
                                }}
                              />
                            </Box>
                            
                            {/* Right side metadata */}
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: { xs: 1, sm: 2 },
                              color: 'text.secondary',
                              fontSize: '0.875rem',
                              flexShrink: 0,
                            }}>
                              {/* Star count */}
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 0.5
                              }}>
                                <StarIcon fontSize="small" sx={{ color: '#f1c40f' }} />
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 600
                                  }}
                                >
                                  {prompt.stars_count}
                                </Typography>
                              </Box>
                              
                              {/* Creation date */}
                              <Typography 
                                variant="body2"
                                sx={{
                                  display: { xs: 'none', sm: 'block' }
                                }}
                              >
                                {format(new Date(prompt.created_at), 'MMM d, yyyy')}
                              </Typography>
                              <Typography 
                                variant="body2"
                                sx={{
                                  display: { xs: 'block', sm: 'none' }
                                }}
                              >
                                {format(new Date(prompt.created_at), 'MM/dd/yy')}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <EmptyState message="No starred prompts" />
              )}
            </TabPanel>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Profile; 