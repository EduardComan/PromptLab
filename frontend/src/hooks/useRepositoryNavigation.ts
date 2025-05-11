import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import RepositoryService from '../services/RepositoryService';

interface Repository {
  id: string;
  primaryPrompt?: {
    id: string;
  };
  prompt?: {
    id: string;
  };
}

export const useRepositoryNavigation = () => {
  const navigate = useNavigate();

  const navigateToRepository = useCallback(async (repository: Repository) => {
    try {
      // Check for prompt ID in different properties based on API response format
      // Different pages might receive different repository formats
      if (repository.primaryPrompt?.id) {
        // Format from Discover page
        navigate(`/prompts/${repository.primaryPrompt.id}`);
        return;
      }
      
      if (repository.prompt?.id) {
        // Format from Profile page
        navigate(`/prompts/${repository.prompt.id}`);
        return;
      }
      
      // If no prompt found in the repository object, fetch the repository details
      // This is a fallback in case the repository object doesn't include prompt information
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
    } catch (error) {
      console.error('Error navigating to repository prompt:', error);
      navigate('/dashboard');
    }
  }, [navigate]);

  return { navigateToRepository };
}; 