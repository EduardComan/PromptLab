import api from './api';
import { User } from '../interfaces';

export class UserService {
  /**
   * Get the current user's profile
   */
  static async getCurrentUser(): Promise<User> {
    const response = await api.get('/accounts/me');
    return response.data.user;
  }

  /**
   * Get a user by username
   */
  static async getUserByUsername(username: string): Promise<User> {
    if (!username) {
      throw new Error('Username is required');
    }
    const response = await api.get(`/accounts/user/${encodeURIComponent(username)}`);
    return response.data.user;
  }

  /**
   * Search users
   */
  static async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const params = new URLSearchParams({
      query: query.trim(),
      limit: limit.toString()
    });
    const response = await api.get(`/users/search?${params.toString()}`);
    return response.data.users || [];
  }

  /**
   * Update user profile
   */
  static async updateProfile(profileData: {
    bio?: string;
    email?: string;
    full_name?: string;
  }): Promise<User> {
    try {
      const response = await api.put('/accounts/profile', profileData);
      return response.data.user;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Upload profile image
   */
  static async uploadProfileImage(file: File): Promise<{ profile_image_id: string }> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post('/accounts/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/accounts/password', {
      current_password: currentPassword.trim(),
      new_password: newPassword.trim()
    });
  }

  /**
   * Delete account
   */
  static async deleteAccount(password: string): Promise<void> {
    await api.post('/users/me/delete', {
      password: password.trim()
    });
  }

  /**
   * Get user notifications
   */
  static async getNotifications(
    limit: number = 20,
    before?: string
  ): Promise<{
    notifications: any[];
    next_cursor?: string;
  }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.append('before', before);
    
    const response = await api.get(`/users/me/notifications?${params.toString()}`);
    return response.data;
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    await api.post(`/users/me/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  static async markAllNotificationsAsRead(): Promise<void> {
    await api.post('/users/me/notifications/read-all');
  }

  /**
   * Get starred repositories for a specific user
   */
  static async getUserStarredRepositories(
    username: string,
    page: number = 1, 
    limit: number = 10
  ): Promise<{ repositories: any[], pagination: any }> {
    try {
      if (!username) {
        throw new Error('Username is required');
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      const response = await api.get(`/accounts/user/${encodeURIComponent(username)}/starred?${params.toString()}`);
      return {
        repositories: response.data.repositories || [],
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching user starred repositories:', error);
      throw error;
    }
  }
}

export default UserService; 