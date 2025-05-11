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
    default_prompt_title?: string;
    default_prompt_content?: string;
  }): Promise<any> {
    try {
      // Format the data as exactly expected by the backend API
      const requestData: any = {
        name: data.name,
        description: data.description || '',
        is_public: data.isPublic
      };

      // Add org_id only if ownerType is 'organization' and orgId is provided
      if (data.ownerType === 'organization' && data.orgId) {
        requestData.org_id = data.orgId;
      }
      
      // Add default prompt information if provided
      if (data.default_prompt_title) {
        requestData.default_prompt_title = data.default_prompt_title;
        requestData.default_prompt_content = data.default_prompt_content || '';
      }
      
      // Debug the request data before sending
      console.log('Repository creation request data:', JSON.stringify(requestData, null, 2));
      
      const response = await api.post('/repositories', requestData);
      console.log('Repository creation successful response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Repository creation error response:', error.response?.data);
      console.error('Repository creation error status:', error.response?.status);
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
      // Format the data as expected by the API - use snake_case for backend
      const requestData: any = {};
      
      // Only include fields that are provided
      if (data.name !== undefined) requestData.name = data.name;
      if (data.description !== undefined) requestData.description = data.description;
      if (data.isPublic !== undefined) requestData.is_public = data.isPublic; // Snake case for backend
      
      console.log('Repository update request data:', JSON.stringify(requestData, null, 2));
      
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
      console.log(`Repository starred successfully, stars:`, response.data);
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
    
    try {
      // Use the correct endpoint based on backend route
      const response = await api.delete(`/repositories/${id}/unstar`);
      console.log(`Repository unstarred successfully, stars:`, response.data);
      return {
        stars: response.data.stars || 0
      };
    } catch (error) {
      console.error(`Error unstarring repository ${id}:`, error);
      throw error;
    }
  }

  /**
   * Check if a repository is starred by the current user
   */
  static async isRepositoryStarred(id: string): Promise<boolean> {
    try {
      const response = await api.get(`/repositories/${id}/star`);
      console.log(`Repository star check response:`, response.data);
      return response.data.is_starred || false;
    } catch (error: any) {
      // A 404 response means the repository is not starred
      if (error.response && error.response.status === 404) {
        return false;
      }
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
          limit
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
          limit,
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