import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import RepositoryService from '../services/RepositoryService';
import { useAuth } from '../contexts/AuthContext';

interface Repository {
  id: string;
  primaryPrompt?: {
    id: string;
  };
  prompt?: {
    id: string;
  };
  is_public?: boolean;
}

export const useRepositoryNavigation = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const navigateToRepository = useCallback(async (repository: Repository) => {
    try {
      if (repository.primaryPrompt?.id) {
        navigate(`/prompts/${repository.primaryPrompt.id}`);
        return;
      }
      
      if (repository.prompt?.id) {
        navigate(`/prompts/${repository.prompt.id}`);
        return;
      }
      try {
        const repoDetails = await RepositoryService.getRepositoryById(repository.id);
        
        if (repoDetails.primaryPrompt?.id) {
          navigate(`/prompts/${repoDetails.primaryPrompt.id}`);
          return;
        }
        
        if (repoDetails.prompt?.id) {
          navigate(`/prompts/${repoDetails.prompt.id}`);
          return;
        }
        
        // If still no prompt found, navigate to dashboard
        console.warn('Repository has no associated prompt:', repository.id);
        navigate('/dashboard');
      } catch (apiError: any) {
        if (apiError.response && apiError.response.status === 401) {
          if (isAuthenticated) {
            navigate('/dashboard', { 
              state: { 
                error: 'This is a private repository that you don\'t have access to.' 
              } 
            });
          } else {
            navigate('/login', { 
              state: { 
                message: 'Please log in to view this private repository',
                redirectTo: window.location.pathname
              } 
            });
          }
        } else if (apiError.response && apiError.response.status === 403) {
          navigate('/dashboard', { 
            state: { 
              error: 'You don\'t have permission to access this repository.' 
            } 
          });
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error navigating to repository prompt:', error);
      navigate('/dashboard');
    }
  }, [navigate, isAuthenticated]);

  return { navigateToRepository };
}; 