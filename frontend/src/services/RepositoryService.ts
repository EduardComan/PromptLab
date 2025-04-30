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
      // Format the data as expected by the API
      const requestData = {
        name: data.name,
        description: data.description || '',
        is_public: data.isPublic,
        owner_type: data.ownerType,
        org_id: data.orgId
      };
      
      const response = await api.post('/repositories', requestData);
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
      // Format the data as expected by the API
      const requestData = {
        name: data.name,
        description: data.description,
        is_public: data.isPublic
      };
      
      const response = await api.put(`/repositories/${id}`, requestData);
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
      console.log(`Starring repository ${id}`);
      const response = await api.post(`/repositories/${id}/star`);
      console.log(`Repository starred successfully, stars: ${response.data.stars}`);
      return {
        stars: response.data.stars || 0
      };
    } catch (error) {
      console.error(`Error starring repository ${id}:`, error);
      throw error;
    }
  }

  /**
   * Unstar a repository
   */
  static async unstarRepository(id: string): Promise<{ stars: number }> {
    console.log(`Unstarring repository ${id}`);
    
    // Try multiple endpoint formats that might be used by the backend
    const endpoints = [
      `/repositories/${id}/star`,      // DELETE to /star
      `/repositories/${id}/unstar`,    // DELETE to /unstar
      `/repositories/${id}/stars`      // DELETE to /stars
    ];
    
    for (let endpoint of endpoints) {
      try {
        console.log(`Trying to unstar using endpoint: ${endpoint}`);
        const response = await api.delete(endpoint);
        console.log(`Repository unstarred successfully via ${endpoint}, stars: ${response.data.stars}`);
        return {
          stars: response.data.stars || 0
        };
      } catch (error) {
        console.warn(`Failed to unstar using endpoint: ${endpoint}`, error);
        // Continue to the next endpoint if this one failed
      }
    }
    
    // If all attempts failed, throw an error
    throw new Error("Failed to unstar repository. All endpoint attempts failed.");
  }

  /**
   * Check if a repository is starred by the current user
   */
  static async isRepositoryStarred(id: string): Promise<boolean> {
    try {
      const response = await api.get(`/repositories/${id}/star`);
      return response.data.isStarred || false;
    } catch (error) {
      console.error('Error checking if repository is starred:', error);
      return false;
    }
  }

  /**
   * Get trending repositories
   */
  static async getTrendingRepositories(limit: number = 10): Promise<any[]> {
    try {
      const response = await api.get(`/repositories/trending`, {
        params: { 
          limit: limit,
          order: 'desc'
        }
      });
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
      const response = await api.get(`/repositories/recent`, {
        params: { 
          limit: limit,
          sort_by: 'created_at',
          order: 'desc'
        }
      });
      return response.data.repositories || [];
    } catch (error) {
      console.error('Error fetching recent repositories:', error);
      throw error;
    }
  }
}

export default RepositoryService; 