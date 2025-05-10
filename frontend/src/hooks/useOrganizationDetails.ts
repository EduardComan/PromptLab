import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Organization, OrganizationMember, Repository } from '../interfaces';
import api from '../services/api';

interface UseOrganizationDetailsReturn {
  organization: Organization | null;
  repositories: Repository[];
  members: OrganizationMember[];
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isOwner: boolean;
  fetchOrganizationDetails: () => Promise<void>;
}

export function useOrganizationDetails(): UseOrganizationDetailsReturn {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const fetchOrganizationDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [orgResponse, reposResponse, membersResponse] = await Promise.all([
        api.get(`/organizations/${id}`),
        api.get(`/organizations/${id}/repositories`),
        api.get(`/organizations/${id}/members`)
      ]);
      setOrganization(orgResponse.data);
      const formattedRepos: Repository[] = reposResponse.data.repositories?.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        slug: repo.slug,
        description: repo.description,
        visibility: repo.visibility,
        organizationId: repo.organizationId,
        createdById: repo.createdById,
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt,
        organization: repo.organization,
        createdBy: repo.createdBy,
        prompts: repo.prompts
      })) || [];
      setRepositories(formattedRepos);
      setMembers(membersResponse.data.members || []);
      if (user) {
        const currentMember = membersResponse.data.members?.find((member: OrganizationMember) => 
          member.user_id === user.id
        );
        if (currentMember) {
          setIsAdmin(currentMember.role === 'ADMIN' || currentMember.role === 'OWNER');
          setIsOwner(currentMember.role === 'OWNER');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load organization details');
      console.error('Error fetching organization details:', err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchOrganizationDetails();
  }, [fetchOrganizationDetails]);

  return {
    organization,
    repositories,
    members,
    loading,
    error,
    isAdmin,
    isOwner,
    fetchOrganizationDetails
  };
} 