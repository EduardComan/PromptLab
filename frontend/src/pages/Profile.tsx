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
  const [starCount, setStarCount] = useState<number>(0);

  // Initialize local state when data loads
  React.useEffect(() => {
    if (prompts && starredPrompts) {
      setLocalPrompts(prompts);
      setLocalStarredPrompts(starredPrompts);
      setStarCount(profile?.starCount || 0);
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
        
        // Update local state immediately
        setLocalPrompts(prev => 
          prev.map(repo => repo.id === repoId ? { ...repo, isStarred: false, stars_count: updatedStars } : repo)
        );
        setLocalStarredPrompts(prev => prev.filter(repo => repo.id !== repoId));
        setStarCount(prevCount => Math.max(0, prevCount - 1));
        
        setSnackbar({ open: true, message: 'Repository unstarred', severity: 'success' });
      } else {
        const result = await RepositoryService.starRepository(repoId);
        updatedStars = result.stars;
        
        // Update local state immediately
        const repoToStar = localPrompts.find(repo => repo.id === repoId);
        if (repoToStar) {
          const updatedRepo = { ...repoToStar, isStarred: true, stars_count: updatedStars };
          setLocalPrompts(prev => 
            prev.map(repo => repo.id === repoId ? updatedRepo : repo)
          );
          // Only add to starred if not already there
          setLocalStarredPrompts(prev => {
            const exists = prev.some(repo => repo.id === repoId);
            return exists ? prev : [...prev, updatedRepo];
          });
          setStarCount(prevCount => prevCount + 1);
        }
        
        setSnackbar({ open: true, message: 'Repository starred', severity: 'success' });
      }
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
                sx={{ mb: 3 }}
              >Edit Profile</Button>
            )}

            <Typography variant="h4" fontWeight="bold">{profile.full_name || profile.username}</Typography>
            <Typography variant="body1" color="text.secondary">@{profile.username}</Typography>
            <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>{profile.bio || 'No bio provided'}</Typography>

            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Organizations</Typography>
            {organizations.length > 0 ? (
              <AvatarGroup max={6}>
                {organizations.map(org => (
                  <Tooltip key={org.id} title={org.name}>
                    <Avatar component={Link} to="/organizations" src={org.logo_image_id ? `/api/images/${org.logo_image_id}` : undefined}>{org.name[0]}</Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            ) : (
              <Typography variant="body2" color="text.secondary">No organizations</Typography>
            )}
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant={isMobile ? 'scrollable' : 'standard'}>
              <Tab label={`Repositories ${profile.promptCount || 0}`} />
              <Tab label={`Starred ${starCount}`} />
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
