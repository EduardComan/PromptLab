import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Repository {
  id: string;
  primaryPrompt?: {
    id: string;
  };
}

export const useRepositoryNavigation = () => {
  const navigate = useNavigate();

  const navigateToRepository = useCallback(async (repository: Repository) => {
    // If the repository already has the prompt information, navigate directly
    if (repository.primaryPrompt?.id) {
      navigate(`/prompts/${repository.primaryPrompt.id}`);
      return;
    }
    
    // Navigate to dashboard if no prompt exists
    navigate('/dashboard');
    console.error('Repository has no associated prompt');
  }, [navigate]);

  return { navigateToRepository };
}; 