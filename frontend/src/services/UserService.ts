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
    const response = await api.get(`/accounts/users/${username}`);
    return response.data.user;
  }

  /**
   * Update user profile
   */
  static async updateProfile(profileData: {
    email?: string;
    full_name?: string;
    bio?: string;
  }): Promise<User> {
    const response = await api.put('/accounts/profile', profileData);
    return response.data.user;
  }

  /**
   * Upload profile image
   */
  static async uploadProfileImage(imageFile: File): Promise<{ profile_image_id: string }> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post('/accounts/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/accounts/change-password', {
      currentPassword,
      newPassword
    });
  }
}

export default UserService; 