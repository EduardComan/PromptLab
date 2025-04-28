import api from './api';
import { Organization, OrganizationMember } from '../interfaces';

class OrganizationService {
  /**
   * Search organizations
   */
  async searchOrganizations(query?: string, limit: number = 10): Promise<Organization[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    params.append('limit', limit.toString());
    const response = await api.get(`/organizations?${params.toString()}`);
    return response.data;
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(): Promise<Organization[]> {
    const response = await api.get('/organizations/me');
    return response.data;
  }

  /**
   * Get popular organizations
   */
  async getPopularOrganizations(limit: number = 10): Promise<Organization[]> {
    const response = await api.get(`/organizations/popular?limit=${limit}`);
    return response.data;
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string): Promise<Organization> {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  }

  /**
   * Get organization by name
   */
  async getOrganizationByName(name: string): Promise<Organization> {
    const response = await api.get(`/organizations/name/${encodeURIComponent(name)}`);
    return response.data;
  }

  /**
   * Create a new organization
   */
  async createOrganization(data: {
    name: string;
    display_name: string;
    description?: string;
  }): Promise<Organization> {
    const response = await api.post('/organizations', data);
    return response.data;
  }

  /**
   * Update organization
   */
  async updateOrganization(
    id: string,
    data: {
      display_name?: string;
      description?: string;
    }
  ): Promise<Organization> {
    const response = await api.put(`/organizations/${id}`, data);
    return response.data;
  }

  /**
   * Delete organization
   */
  async deleteOrganization(id: string): Promise<void> {
    await api.delete(`/organizations/${id}`);
  }

  /**
   * Upload organization logo
   */
  async uploadOrganizationLogo(id: string, file: File): Promise<{ logo_url: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post(`/organizations/${id}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(id: string): Promise<OrganizationMember[]> {
    const response = await api.get(`/organizations/${id}/members`);
    return response.data;
  }

  /**
   * Invite member to organization
   */
  async inviteMember(
    orgId: string,
    data: {
      email: string;
      role: 'ADMIN' | 'MEMBER';
    }
  ): Promise<void> {
    await api.post(`/organizations/${orgId}/members/invite`, data);
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    orgId: string,
    memberId: string,
    role: 'ADMIN' | 'MEMBER'
  ): Promise<void> {
    await api.put(`/organizations/${orgId}/members/${memberId}`, { role });
  }

  /**
   * Remove member
   */
  async removeMember(orgId: string, memberId: string): Promise<void> {
    await api.delete(`/organizations/${orgId}/members/${memberId}`);
  }

  /**
   * Leave organization
   */
  async leaveOrganization(id: string): Promise<void> {
    await api.post(`/organizations/${id}/leave`);
  }
}

export const organizationService = new OrganizationService(); 