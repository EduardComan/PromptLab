import { useEffect, useState } from 'react';
import api from '../services/api';
import { User, Organization } from '../interfaces';
import { Repository } from '../interfaces';

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
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [starredRepositories, setStarredRepositories] = useState<Repository[]>([]);
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
        : `/repositories/user/${userData.username}`;
      const repoRes = await api.get(repoUrl);
      const repos: Repository[] = repoRes.data.repositories.map(mapRepo);
      setRepositories(repos);
      userData.promptCount = repos.length;

      // Get starred
      const starredUrl = username
        ? `/accounts/user/${username}/starred`
        : '/accounts/me/starred';
      const starRes = await api.get(starredUrl);
      const starred = (starRes.data.repositories || []).filter(
        (r: any) => r.owner_user?.username === (username || currentUser?.username)
      );
      const starredRepos: Repository[] = starred.map((r: any) => 
        mapRepo(r, true) // Pass true to mark as starred
      );
      setStarredRepositories(starredRepos);
      
      // Use star count from API response if available, otherwise use the length of starred repositories
      userData.starCount = starRes.data.starCount !== undefined ? 
        starRes.data.starCount : 
        starredRepos.length;

      // Cross mark starred flags in repositories
      const starredIds = new Set(starredRepos.map(r => r.id));
      setRepositories(current =>
        current.map(repo => ({
          ...repo,
          stats: {
            ...repo.stats,
            is_starred: starredIds.has(repo.id)
          }
        }))
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
    repositories,
    starredRepositories,
    organizations,
    loading,
    error,
    refresh: fetchProfileData
  };
}

// Helper function to map API response to Repository interface
function mapRepo(repo: any, isStarred = false): Repository {     
  // Create consistent structure
  return {
    id: repo.id,
    name: repo.name,
    description: repo.description,
    is_public: repo.is_public,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    owner_user: repo.owner_user,
    owner_org: repo.owner_org,
    latest_prompt: repo.prompt || (repo.primaryPrompt ? {
      id: repo.primaryPrompt.id,
      title: repo.name, // Use repo name as fallback title
      description: repo.description
    } : undefined),
    stats: {
      stars: repo.stats?.stars !== undefined ? repo.stats.stars : 0,
      prompts: repo._count?.prompts || 0,
      is_starred: isStarred || repo.stats?.is_starred || false
    }
  };
}
