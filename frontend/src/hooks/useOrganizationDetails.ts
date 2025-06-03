import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Organization, OrganizationMember } from '../interfaces';
import { Repository } from '../interfaces';
import api from '../services/api';

interface UseOrganizationDetailsReturn {
  organization: Organization | null;
  repositories: Repository[];
  members: OrganizationMember[];
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isOwner: boolean;
  isMember: boolean;
  fetchOrganizationDetails: () => Promise<void>;
  setRepositories: React.Dispatch<React.SetStateAction<Repository[]>>;
}

export function useOrganizationDetails(): UseOrganizationDetailsReturn {
  const { id } = useParams<{ id?: string }>();
  const orgId = id;
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const fetchOrganizationDetails = useCallback(async () => {
    if (!orgId) return;

    setLoading(true);
    setError(null);

    try {
      const orgResponse = await api.get(`/organizations/${orgId}`);

      if (orgResponse?.data?.organization && typeof orgResponse.data.organization === 'object') {
        const orgData = {
          id: orgResponse.data.organization.id || '',
          name: orgResponse.data.organization.name || '',
          display_name: orgResponse.data.organization.display_name || '',
          description: orgResponse.data.organization.description || '',
          ...orgResponse.data.organization
        };

        setOrganization(orgData);
      } else {
        throw new Error('Invalid organization data received');
      }

      const [reposResponse, membersResponse] = await Promise.all([
        api.get(`/organizations/${orgId}/repositories`),
        api.get(`/organizations/${orgId}/members`)
      ]);

      const formattedRepos: Repository[] = 
        (reposResponse?.data?.repositories && Array.isArray(reposResponse.data.repositories))
          ? reposResponse.data.repositories.map((repo: any) => {
              const isStarred = repo.is_starred || false;
              return {
                id: repo.id || '',
                name: repo.name || '',
                description: repo.description || '',
                is_public: repo.is_public !== undefined ? repo.is_public : true,
                created_at: repo.created_at || new Date().toISOString(),
                updated_at: repo.updated_at,
                owner_org: repo.owner_org_id || repo.organization_id || null,
                owner_user: repo.owner_user_id || repo.created_by_id || null,
                _count: {
                  stars: repo._count?.stars || 0 
                },
                is_starred: isStarred,
              };
            })
          : [];

      setRepositories(formattedRepos);

      let membersList: OrganizationMember[] = [];
      if (membersResponse?.data?.members && Array.isArray(membersResponse.data.members)) {
        membersList = membersResponse.data.members;
      } else if (Array.isArray(membersResponse?.data)) {
        membersList = membersResponse.data;
      }

      setMembers(membersList);

      if (user) {
        const currentMember = membersList.find(
          (member: OrganizationMember) => member.user_id === user.id || member.id === user.id
        );

        if (currentMember) {
          const isAdminRole = currentMember.role === 'ADMIN' || currentMember.role === 'OWNER';
          const isOwnerRole = currentMember.role === 'OWNER';

          setIsAdmin(isAdminRole);
          setIsOwner(isOwnerRole);
          setIsMember(true);
        } else {
          setIsAdmin(false);
          setIsOwner(false);
          setIsMember(false);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load organization details');
      setOrganization(null);
      setRepositories([]);
      setMembers([]);
      setIsAdmin(false);
      setIsOwner(false);
      setIsMember(false);
    } finally {
      setLoading(false);
    }
  }, [orgId, user]);

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
    isMember,
    fetchOrganizationDetails,
    setRepositories
  };
}