// src/hooks/useProfileData.ts
import { useEffect, useState } from 'react';
import api from '../services/api';
import { User, Organization } from '../interfaces';
import { Repository } from '../components/Repository/RepositoryGrid';

export interface ExtendedUser extends User {
  promptCount?: number;
  starCount?: number;
}

export function useProfileData(
  username: string | undefined,
  currentUser: User | null,
  isAuthenticated: boolean
) {
  const [profile, setProfile] = useState<ExtendedUser | null>(null);
  const [prompts, setPrompts] = useState<Repository[]>([]);
  const [starredPrompts, setStarredPrompts] = useState<Repository[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      let userData: ExtendedUser | null = null;

      if (username) {
        const res = await api.get(`/accounts/user/${username}`);
        userData = res.data.user || res.data;
      } else if (currentUser) {
        userData = currentUser as ExtendedUser;
      } else {
        throw new Error('No user context');
      }

      if (!userData) throw new Error('User not found');

      // Get repositories
      const repoUrl = username
        ? `/repositories/user/${username}`
        : `/repositories?username=${userData.username}`;
      const repoRes = await api.get(repoUrl);
      const repos: Repository[] = repoRes.data.repositories.map(mapRepo);
      setPrompts(repos);
      userData.promptCount = repos.length;

      // Get starred
      const starredUrl = username
        ? `/accounts/user/${username}/starred`
        : '/accounts/me/starred';
      const starRes = await api.get(starredUrl);
      const starred = (starRes.data.repositories || []).filter(
        (r: any) => r.owner_user?.username === (username || currentUser?.username)
      );
      const starredRepos: Repository[] = starred.map((r: any) => ({
        ...mapRepo(r),
        isStarred: true
      }));
      setStarredPrompts(starredRepos);
      
      // Use star count from API response if available, otherwise use the length of starred repositories
      userData.starCount = starRes.data.starCount !== undefined ? 
        starRes.data.starCount : 
        starredRepos.length;

      // Cross mark starred flags in prompts
      const starredIds = new Set(starredRepos.map(r => r.id));
      setPrompts(current =>
        current.map(repo => ({ ...repo, isStarred: starredIds.has(repo.id) }))
      );

      // Organizations
      if (isAuthenticated) {
        const orgUrl = username && username !== currentUser?.username
          ? `/organizations?username=${username}`
          : `/organizations/me`;
        const orgRes = await api.get(orgUrl);
        setOrganizations(orgRes.data.organizations || []);
      }

      setProfile(userData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [username, currentUser?.username]);

  return {
    profile,
    prompts,
    starredPrompts,
    organizations,
    loading,
    error,
    refresh: fetchProfileData
  };
}

function mapRepo(repo: any): Repository {
  // Normalize star count from different possible API response formats
  const starCount = 
    // Direct stars_count property
    repo.stars_count !== undefined ? repo.stars_count : 
    // From metrics object
    repo.metrics?.stars !== undefined ? repo.metrics.stars :
    // From _count object
    repo._count?.stars !== undefined ? repo._count.stars : 
    // Fallback
    0;
    
  return {
    id: repo.id,
    name: repo.name,
    description: repo.description,
    is_public: repo.is_public,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    stars_count: starCount,
    owner_user: repo.owner_user,
    owner_org: repo.owner_org,
    isStarred: repo.isStarred || false,
    tags: repo.tags,
    prompt: repo.prompt || (repo.primaryPrompt ? {
      id: repo.primaryPrompt.id,
      title: repo.name, // Use repo name as fallback title
      description: repo.description
    } : undefined),
    _count: {
      ...(repo._count || {}),
      stars: starCount
    }
  };
}
