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
  const { id, name } = useParams<{ id?: string; name?: string }>();
  const orgIdentifier = id || name;
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const fetchOrganizationDetails = useCallback(async () => {
    if (!orgIdentifier) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // The backend API expects the organization name as the URL parameter
      // If we have an ID, we'll need to convert it to a name
      const orgName = name || id;
      
      if (!orgName) {
        throw new Error('No organization identifier provided');
      }
      
      // Fetch the organization details first
      try {
        const orgResponse = await api.get(`/organizations/${orgName}`);
        
        // Verify that the response contains an organization object with required fields
        if (orgResponse?.data?.organization && typeof orgResponse.data.organization === 'object') {
          // Ensure organization has at least an id and name
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
      } catch (orgError: any) {
        console.error('Error fetching organization details:', orgError);
        throw orgError; // Rethrow to be caught by the outer catch
      }
      
      // Once we have the organization, fetch repositories and members
      try {
        const [reposResponse, membersResponse] = await Promise.all([
          api.get(`/organizations/${orgName}/repositories`),
          api.get(`/organizations/${orgName}/members`)
        ]);
        
        const formattedRepos: Repository[] = 
          (reposResponse?.data?.repositories && Array.isArray(reposResponse.data.repositories))
            ? reposResponse.data.repositories.map((repo: any) => ({
                id: repo.id || '',
                name: repo.name || '',
                slug: repo.slug || '',
                description: repo.description || '',
                visibility: repo.visibility || 'private',
                organizationId: repo.organizationId || '',
                createdById: repo.createdById || '',
                createdAt: repo.createdAt || new Date().toISOString(),
                updatedAt: repo.updatedAt || new Date().toISOString(),
                organization: repo.organization || null,
                createdBy: repo.createdBy || null,
                prompts: repo.prompts || []
              }))
            : [];
        
        setRepositories(formattedRepos);
        
        // Process members data, handling different response formats
        let membersList: OrganizationMember[] = [];
        if (membersResponse?.data?.members && Array.isArray(membersResponse.data.members)) {
          membersList = membersResponse.data.members;
        } else if (membersResponse?.data && Array.isArray(membersResponse.data)) {
          // Alternative format that might be returned
          membersList = membersResponse.data;
        }
        
        setMembers(membersList);
        
        // Set user permissions
        if (user) {
          const currentMember = membersList.find(
            (member: OrganizationMember) => member.user_id === user.id || member.id === user.id
          );
          
          if (currentMember) {
            const isAdminRole = currentMember.role === 'ADMIN' || currentMember.role === 'OWNER';
            const isOwnerRole = currentMember.role === 'OWNER';
            
            setIsAdmin(isAdminRole);
            setIsOwner(isOwnerRole);
          } else {
            setIsAdmin(false);
            setIsOwner(false);
          }
        }
      } catch (repoError: any) {
        console.error('Error fetching organization repositories or members:', repoError);
        // More specific error messages
        const errorMessage = repoError.response?.status === 404 
          ? 'Organization repositories or members not found'
          : repoError.response?.status === 403
            ? 'You do not have permission to view this organization\'s data'
            : 'Failed to load organization repositories or members';
        
        // Log detailed error for debugging but show simple message to user
        console.error(`${errorMessage}: `, repoError);
            
        // We can still show the organization even if repos/members fail to load
        setRepositories([]);
        setMembers([]);
      }
    } catch (err: any) {
      console.error('Error in organization details hook:', err);
      setError(err.response?.data?.message || 'Failed to load organization details');
      setOrganization(null);
      setRepositories([]);
      setMembers([]);
      setIsAdmin(false);
      setIsOwner(false);
    } finally {
      setLoading(false);
    }
  }, [id, name, orgIdentifier, user]);

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