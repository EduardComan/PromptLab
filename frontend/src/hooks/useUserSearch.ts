import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface User {
  id: string;
  username: string;
  full_name?: string;
  profile_image_id?: string;
}

export const useUserSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/accounts/search?query=${encodeURIComponent(query.trim())}&limit=10`);
      setUsers(response.data.users || []);
    } catch (err: any) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setUsers([]);
    setError(null);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    users,
    loading,
    error,
    clearSearch
  };
}; 