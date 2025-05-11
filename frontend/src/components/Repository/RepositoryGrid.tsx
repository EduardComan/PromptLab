import React, { useState, useCallback, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Button,
  CircularProgress,
  Pagination,
  Stack
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import RepositoryService from '../../services/RepositoryService';
import RepositoryCard from './RepositoryCard';
import RepositoryWideCard from './RepositoryWideCard';

export interface Repository {
  id: string;
  name: string;
  title?: string;
  description: string | null;
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
  created_at: string;
  updated_at?: string;
  stars_count?: number;
  metrics?: {
    stars?: number;
    prompt_count?: number;
    star_count?: number;
    is_starred?: boolean;
  };
  _count?: {
    stars?: number;
  };
  is_starred?: boolean;
  prompt?: {
    id: string;
    title: string;
    description: string | null;
  };
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

interface RepositoryGridProps {
  repositories: Repository[];
  title?: string;
  emptyMessage?: string;
  loading?: boolean;
  onStar?: (id: string, isStarred: boolean) => Promise<void>;
  hideCreateButton?: boolean | string;
  onRepositoriesUpdate?: (repositories: Repository[]) => void;
  viewMode?: 'grid' | 'list' | 'responsive';
  profileImage?: string;
  itemsPerPage?: number;
}

const RepositoryGrid: React.FC<RepositoryGridProps> = ({
  repositories,
  title,
  emptyMessage = "No repositories found",
  loading = false,
  onStar,
  hideCreateButton = false,
  onRepositoriesUpdate,
  viewMode = 'list',
  profileImage,
  itemsPerPage = 4
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingStars, setLoadingStars] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [paginatedRepositories, setPaginatedRepositories] = useState<Repository[]>([]);
  
  // Convert hideCreateButton to a boolean if it's a string
  const shouldHideButton = typeof hideCreateButton === 'string' 
    ? hideCreateButton === 'true' 
    : Boolean(hideCreateButton);

  // Handle pagination
  useEffect(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedRepositories(repositories.slice(startIndex, endIndex));
  }, [repositories, page, itemsPerPage]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Scroll to top of grid when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCreateRepo = useCallback(() => {
    navigate('/repositories/new');
  }, [navigate]);

  const handleStarToggle = useCallback(async (repoId: string, isStarred: boolean) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      setLoadingStars(prev => ({ ...prev, [repoId]: true }));
      
      let updatedStars = 0;
      let updatedRepositories: Repository[] = [];
      
      // Call the appropriate service method and update UI with accurate star count from backend
      if (isStarred) {
        const result = await RepositoryService.unstarRepository(repoId);
        updatedStars = result.stars;
        
        updatedRepositories = repositories.map(repo => {
          if (repo.id === repoId) {
            return {
              ...repo,
              isStarred: false,
              is_starred: false,
              stars_count: updatedStars,
              _count: { ...(repo._count || {}), stars: updatedStars },
              // Conditionally add metrics if it exists
              ...(repo.metrics ? {
                metrics: {
                  ...(repo.metrics || {}),
                  stars: updatedStars,
                  star_count: updatedStars
                }
              } : {})
            };
          }
          return repo;
        });
      } else {
        const result = await RepositoryService.starRepository(repoId);
        updatedStars = result.stars;
        
        updatedRepositories = repositories.map(repo => {
          if (repo.id === repoId) {
            return {
              ...repo,
              isStarred: true,
              is_starred: true,
              stars_count: updatedStars,
              _count: { ...(repo._count || {}), stars: updatedStars },
              // Conditionally add metrics if it exists
              ...(repo.metrics ? {
                metrics: {
                  ...(repo.metrics || {}),
                  stars: updatedStars,
                  star_count: updatedStars
                }
              } : {})
            };
          }
          return repo;
        });
      }
      
      // Notify parent component of the update if callback exists
      if (onRepositoriesUpdate) {
        onRepositoriesUpdate(updatedRepositories);
      }
      
      // Call onStar callback for parent components to refresh data if provided
      if (onStar) {
        await onStar(repoId, isStarred);
      }
    } catch (err) {
      console.error('Error toggling star:', err);
      // If there was an error, notify parent component to revert UI
      if (onRepositoriesUpdate) {
        onRepositoriesUpdate(repositories);
      }
    } finally {
      setLoadingStars(prev => ({ ...prev, [repoId]: false }));
    }
  }, [user, navigate, onStar, repositories, onRepositoriesUpdate]);
  
  const renderCreateButton = () => (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={handleCreateRepo}
      sx={{
        background: 'linear-gradient(45deg, #4568dc, #b06ab3)',
        boxShadow: '0 4px 12px rgba(176, 106, 179, 0.2)',
        '&:hover': {
          background: 'linear-gradient(45deg, #3457cb, #9f59a2)',
          boxShadow: '0 6px 16px rgba(176, 106, 179, 0.3)',
        }
      }}
    >
      New Repository
    </Button>
  );

  const renderGridView = () => (
    <Grid container spacing={3}>
      {paginatedRepositories.map((repository) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={repository.id}>
          <RepositoryCard 
            repository={repository} 
            onStar={handleStarToggle}
          />
        </Grid>
      ))}
    </Grid>
  );

  const renderListView = () => (
    <Grid container spacing={3}>
      {paginatedRepositories.map((repository) => (
        <Grid item xs={12} key={`list-${repository.id}`}>
          <RepositoryWideCard 
            repository={repository} 
            onStar={handleStarToggle}
            profileImage={profileImage}
          />
        </Grid>
      ))}
    </Grid>
  );

  const totalPages = Math.ceil(repositories.length / itemsPerPage);
  
  return (
    <Box>
      {title && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {user && !shouldHideButton && renderCreateButton()}
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : repositories.length > 0 ? (
        <>
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'list' && renderListView()}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Stack spacing={2} sx={{ mt: 4, display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Page {page} of {totalPages}
                </Typography>
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: '50%',
                      minWidth: 40,
                      height: 40,
                    },
                    '& .MuiPaginationItem-page.Mui-selected': {
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #4568dc, #b06ab3)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #3457cb, #9f59a2)',
                      },
                    },
                  }}
                />
              </Box>
            </Stack>
          )}
          
          {/* Create new repo button at the bottom of the list when viewing multiple repositories */}
          {user && !shouldHideButton && repositories.length >= 4 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              {renderCreateButton()}
            </Box>
          )}
        </>
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
            {emptyMessage}
          </Typography>
          {user && !shouldHideButton && renderCreateButton()}
        </Box>
      )}
    </Box>
  );
};

export default RepositoryGrid;