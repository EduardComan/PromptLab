import React, { useState } from 'react';
import {
  Box, Container, CircularProgress, Snackbar, Alert, Grid, Tab, Tabs, Typography,
  Avatar, Button, AvatarGroup, Tooltip, useMediaQuery, useTheme
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RepositoryWideCard from '../components/Repository/RepositoryWideCard';
import { useProfileData } from '../hooks/useProfileData';
import RepositoryService from '../services/RepositoryService';
import { useRepositoryNavigation } from '../hooks/useRepositoryNavigation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

function EmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ py: 5, textAlign: 'center' }}>
      <Typography variant="body1" color="text.secondary">{message}</Typography>
    </Box>
  );
}

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    profile,
    prompts,
    starredPrompts,
    organizations,
    loading,
    error,
    refresh
  } = useProfileData(username, user, isAuthenticated);

  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [localPrompts, setLocalPrompts] = useState<any[]>([]);
  const [localStarredPrompts, setLocalStarredPrompts] = useState<any[]>([]);

  // Initialize local state when data loads
  React.useEffect(() => {
    if (prompts && starredPrompts) {
      setLocalPrompts(prompts);
      setLocalStarredPrompts(starredPrompts);
    }
  }, [prompts, starredPrompts, profile]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStarToggle = async (repoId: string, isStarred: boolean) => {
    try {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      let updatedStars = 0;
      
      if (isStarred) {
        const result = await RepositoryService.unstarRepository(repoId);
        updatedStars = result.stars;
      } else {
        const result = await RepositoryService.starRepository(repoId);
        updatedStars = result.stars;
      }

      // Update local repositories with accurate star count
      setLocalPrompts(prevPrompts => 
        prevPrompts.map(repo => {
          if (repo.id === repoId) {
            return {
              ...repo,
              isStarred: !isStarred,
              is_starred: !isStarred,
              stars_count: updatedStars,
              _count: { ...(repo._count || {}), stars: updatedStars },
              // Conditionally add metrics if it exists
              ...(repo.metrics ? {
                metrics: {
                  ...(repo.metrics || {}),
                  stars: updatedStars,
                  starCount: updatedStars
                }
              } : {})
            };
          }
          return repo;
        })
      );
      
      // If this is a star action (not unstar), also update starred repos list
      if (!isStarred) {
        // Find the repo in the prompts list
        const repoToAdd = localPrompts.find(repo => repo.id === repoId);
        if (repoToAdd) {
          // Add to starred if not already there
          const updatedRepo = {
            ...repoToAdd,
            isStarred: true,
            is_starred: true,
            stars_count: updatedStars,
            _count: { ...(repoToAdd._count || {}), stars: updatedStars },
            // Conditionally add metrics if it exists
            ...(repoToAdd.metrics ? {
              metrics: {
                ...(repoToAdd.metrics || {}),
                stars: updatedStars,
                starCount: updatedStars
              }
            } : {})
          };
          
          // Check if it's already in the starred list
          if (!localStarredPrompts.some(repo => repo.id === repoId)) {
            setLocalStarredPrompts(prev => [...prev, updatedRepo]);
          } else {
            // Just update the existing starred repo
            setLocalStarredPrompts(prev => 
              prev.map(repo => repo.id === repoId ? updatedRepo : repo)
            );
          }
        }
      } else {
        // Remove from starred repos if unstarring
        setLocalStarredPrompts(prev => 
          prev.filter(repo => repo.id !== repoId)
        );
      }

      setSnackbar({ open: true, message: isStarred ? 'Repository unstarred' : 'Repository starred', severity: 'success' });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Error updating star', severity: 'error' });
      // Refresh from server on error to ensure consistent state
      refresh();
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>;
  }

  if (error || !profile) {
    return <Box sx={{ py: 3 }}><Typography color="error">{error || 'User not found'}</Typography></Box>;
  }

  return (
    <Box sx={{ flexGrow: 1, width: '100%', height: '100%', overflow: 'auto', pt: 4 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 4 }}>
          <Box sx={{ width: { xs: '100%', md: '30%' }, maxWidth: 320, mx: { xs: 'auto', md: 0 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={profile.profile_image_id ? `/api/accounts/profile-image/${profile.profile_image_id}` : profile.picture_url || undefined}
                alt={profile.username}
                sx={{ width: 130, height: 130, mb: 2 }}
              >{profile.username[0].toUpperCase()}</Avatar>

              {isAuthenticated && (!username || username === user?.username) && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  component={Link}
                  to="/profile/edit"
                  size="small"
                  sx={{ mt: 2, mb: 3 }}
                >Edit Profile</Button>
              )}
            </Box>

            <Typography variant="h4" fontWeight="bold">{profile.full_name || profile.username}</Typography>
            <Typography variant="body1" color="text.secondary">@{profile.username}</Typography>
            
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1">
                {profile.bio || 'No bio provided'}
              </Typography>
            </Box>

            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Organizations</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              {organizations.length > 0 ? (
                <AvatarGroup max={6}>
                  {organizations.map(org => (
                    <Tooltip key={org.id} title={org.name}>
                      <Avatar
                        component={Link}
                        to={`/organizations/${org.name}`}
                        src={org.logo_image_id ? `/api/images/${org.logo_image_id}` : undefined}
                        sx={{ cursor: 'pointer' }}
                      >
                        {org.name[0]}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No organizations
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant={isMobile ? 'scrollable' : 'standard'}>
              <Tab label={`Repositories ${profile.promptCount || 0}`} />
              <Tab label={`Starred ${localStarredPrompts.length}`} />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {localPrompts.length > 0 ? (
                <Grid container spacing={3}>
                  {localPrompts.map(repo => (
                    <Grid item xs={12} key={repo.id}>
                      <RepositoryWideCard
                        repository={repo}
                        onStar={handleStarToggle}
                        profileImage={profile.profile_image_id ? `/api/accounts/profile-image/${profile.profile_image_id}` : undefined}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : <EmptyState message="No repositories found" />}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {localStarredPrompts.length > 0 ? (
                <Grid container spacing={3}>
                  {localStarredPrompts.map(repo => (
                    <Grid item xs={12} key={repo.id}>
                      <RepositoryWideCard
                        repository={repo}
                        onStar={handleStarToggle}
                        profileImage={profile.profile_image_id ? `/api/accounts/profile-image/${profile.profile_image_id}` : undefined}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : <EmptyState message="No starred repositories" />}
            </TabPanel>
          </Box>
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Profile;
