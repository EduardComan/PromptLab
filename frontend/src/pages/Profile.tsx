import { Edit as EditIcon } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  CircularProgress,
  Grid,
  Snackbar,
  Tab, Tabs,
  Tooltip,
  Typography,
  useMediaQuery, useTheme
} from '@mui/material';
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import RepositoryWideCard from '../components/Repository/RepositoryWideCard';
import { useAuth } from '../contexts/AuthContext';
import { useProfileData } from '../hooks/useProfileData';
import RepositoryService from '../services/RepositoryService';
import { getProfileImageUrl, getImageUrl } from '../utils/imageUtils';

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
    repositories,
    starredRepositories,
    organizations,
    loading,
    error,
    refresh
  } = useProfileData(username, user, isAuthenticated);

  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [localRepos, setLocalRepos] = useState<any[]>([]);
  const [localStarredRepos, setLocalStarredRepos] = useState<any[]>([]);

  React.useEffect(() => {
    if (repositories && starredRepositories) {
      setLocalRepos(repositories);
      setLocalStarredRepos(starredRepositories);
    }
  }, [repositories, starredRepositories, profile]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStarToggle = async (repoId: string, isStarred: boolean) => {
    try {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      // Optimistically update UI first
      // Update repositories tab
      setLocalRepos(prevRepos => 
        prevRepos.map(repo => {
          if (repo.id === repoId) {
            // Adjust star count
            const currentStars = repo.stats?.stars || 0;
            const newStarCount = isStarred ? Math.max(0, currentStars - 1) : currentStars + 1;
            
            return {
              ...repo,
              stats: {
                ...repo.stats,
                stars: newStarCount,
                is_starred: !isStarred
              }
            };
          }
          return repo;
        })
      );
      
      // Update starred repositories tab
      if (isStarred) {
        // Remove from starred repos if unstarring
        setLocalStarredRepos(prev => prev.filter(repo => repo.id !== repoId));
      } else {
        // Add to starred repos if starring
        const repoToAdd = localRepos.find(repo => repo.id === repoId);
        if (repoToAdd) {
          const starredRepo = {
            ...repoToAdd,
            stats: {
              ...repoToAdd.stats,
              is_starred: true
            }
          };
          setLocalStarredRepos(prev => [starredRepo, ...prev]);
        }
      }

      // Make API call
      if (isStarred) {
        await RepositoryService.unstarRepository(repoId);
      } else {
        await RepositoryService.starRepository(repoId);
      }

      setSnackbar({ 
        open: true, 
        message: isStarred ? 'Repository unstarred' : 'Repository starred', 
        severity: 'success' 
      });
      
      // Refresh from server to ensure consistency
      refresh();
    } catch (err) {
      console.error(err);
      setSnackbar({ 
        open: true, 
        message: 'Error updating star', 
        severity: 'error' 
      });
      // Refresh from server on error
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
      {/* <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}> */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 4, mx:4 }}>
          <Box sx={{ width: { xs: '100%', md: '30%' }, minWidth: 360, maxWidth: 360, mx: { xs: 'auto', md: 0 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                alt={profile.full_name || profile.username}
                src={profile.profile_image_id ? getProfileImageUrl(profile.profile_image_id) : profile.picture_url || undefined}
                sx={{ width: 130, height: 130, mb: 2 }}
              >
                {(profile.full_name || profile.username)[0].toUpperCase()}
              </Avatar>

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
                        to={`/organizations/${org.id}`}
                        src={org.logo_image_id ? getImageUrl(org.logo_image_id) : undefined}
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
              <Tab label={`Starred ${localStarredRepos.length}`} />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {localRepos.length > 0 ? (
                <Grid container spacing={3}>
                  {localRepos.map(repo => (
                    <Grid item xs={12} key={repo.id}>
                      <RepositoryWideCard
                        repository={repo}
                        onStar={handleStarToggle}
                        profileImage={profile.profile_image_id ? getProfileImageUrl(profile.profile_image_id) : undefined}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : <EmptyState message="No repositories found" />}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {localStarredRepos.length > 0 ? (
                <Grid container spacing={3}>
                  {localStarredRepos.map(repo => (
                    <Grid item xs={12} key={repo.id}>
                      <RepositoryWideCard
                        repository={repo}
                        onStar={handleStarToggle}
                        profileImage={profile.profile_image_id ? getProfileImageUrl(profile.profile_image_id) : undefined}
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
      {/* </Container> */}
    </Box>
  );
};

export default Profile;
