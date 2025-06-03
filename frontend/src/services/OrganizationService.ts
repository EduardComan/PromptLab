import api from './api';
import { Organization, OrganizationMember } from '../interfaces';

class OrganizationService {
  async getAllOrganizations(limit?: number): Promise<Organization[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    const response = await api.get(`/organizations?${params.toString()}`);
    return response.data.organizations;
  }

  async searchOrganizations(query?: string, limit: number = 10): Promise<Organization[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    params.append('limit', limit.toString());
    const response = await api.get(`/organizations?${params.toString()}`);
    return response.data.organizations;
  }

  async getUserOrganizations(): Promise<Organization[]> {
    const response = await api.get('/organizations/me');
    return response.data.organizations;
  }

  async getPopularOrganizations(limit: number = 10): Promise<Organization[]> {
    const response = await api.get(`/organizations/popular?limit=${limit}`);
    return response.data.organizations;
  }

  async getOrganizationById(id: string): Promise<Organization> {
    const response = await api.get(`/organizations/${id}`);
    return response.data.organization;
  }

  async createOrganization(data: {
    name: string;
    display_name: string;
    description?: string;
  }): Promise<Organization> {
    const response = await api.post('/organizations', data);
    return response.data.organization;
  }

  async updateOrganization(
    id: string,
    data: {
      display_name?: string;
      description?: string;
    }
  ): Promise<Organization> {
    const response = await api.put(`/organizations/${id}`, data);
    return response.data.organization;
  }

  async deleteOrganization(id: string): Promise<void> {
    await api.delete(`/organizations/${id}`);
  }

  async uploadOrganizationLogo(id: string, file: File): Promise<Organization> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post(`/organizations/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.organization;
  }

  async getOrganizationMembers(id: string): Promise<OrganizationMember[]> {
    const response = await api.get(`/organizations/${id}/members`);
    return response.data.members;
  }

  async inviteMember(
    orgId: string,
    data: {
      username: string;
      role: 'ADMIN' | 'MEMBER';
    }
  ): Promise<void> {
    await api.post(`/organizations/${orgId}/members/${data.username}`, { role: data.role });
  }

  async updateMemberRole(
    orgId: string,
    memberId: string,
    role: 'ADMIN' | 'MEMBER'
  ): Promise<void> {
    await api.put(`/organizations/${orgId}/members/${memberId}`, { role });
  }

  async removeMember(orgId: string, memberId: string): Promise<void> {
    await api.delete(`/organizations/${orgId}/members/${memberId}`);
  }

  async leaveOrganization(id: string): Promise<void> {
    await api.delete(`/organizations/${id}/leave`);
  }
}

export default new OrganizationService();