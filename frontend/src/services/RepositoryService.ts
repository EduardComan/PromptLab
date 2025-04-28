import api from './api';

export class RepositoryService {
  /**
   * Get a repository by ID
   */
  static async getRepositoryById(id: string): Promise<any> {
    try {
      const response = await api.get(`/repositories/${id}`);
      return response.data.repository;
    } catch (error) {
      console.error('Error fetching repository:', error);
      throw error;
    }
  }

  /**
   * Create a new repository
   */
  static async createRepository(data: {
    name: string;
    description?: string;
    isPublic: boolean;
    ownerType: 'user' | 'organization';
    orgId?: string;
  }): Promise<any> {
    try {
      const response = await api.post('/repositories', data);
      return response.data;
    } catch (error) {
      console.error('Error creating repository:', error);
      throw error;
    }
  }

  /**
   * Update a repository
   */
  static async updateRepository(id: string, data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<any> {
    try {
      const response = await api.put(`/repositories/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating repository:', error);
      throw error;
    }
  }

  /**
   * Delete a repository
   */
  static async deleteRepository(id: string): Promise<void> {
    try {
      await api.delete(`/repositories/${id}`);
    } catch (error) {
      console.error('Error deleting repository:', error);
      throw error;
    }
  }

  /**
   * Star a repository
   */
  static async starRepository(id: string): Promise<{ stars: number }> {
    try {
      const response = await api.post(`/repositories/${id}/star`);
      return {
        stars: response.data.stars
      };
    } catch (error) {
      console.error('Error starring repository:', error);
      throw error;
    }
  }

  /**
   * Unstar a repository
   */
  static async unstarRepository(id: string): Promise<{ stars: number }> {
    try {
      const response = await api.delete(`/repositories/${id}/unstar`);
      return {
        stars: response.data.stars
      };
    } catch (error) {
      console.error('Error unstarring repository:', error);
      throw error;
    }
  }

  /**
   * Get trending repositories
   */
  static async getTrendingRepositories(limit: number = 10): Promise<any[]> {
    try {
      const response = await api.get(`/repositories/trending?limit=${limit}`);
      return response.data.repositories || [];
    } catch (error) {
      console.error('Error fetching trending repositories:', error);
      throw error;
    }
  }

  /**
   * Get recent repositories
   */
  static async getRecentRepositories(limit: number = 10): Promise<any[]> {
    try {
      const response = await api.get(`/repositories/recent?limit=${limit}`);
      return response.data.repositories || [];
    } catch (error) {
      console.error('Error fetching recent repositories:', error);
      throw error;
    }
  }
}

export default RepositoryService; 