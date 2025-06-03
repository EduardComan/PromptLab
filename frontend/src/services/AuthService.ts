import api from './api';
import { User, RegisterData } from '../interfaces';

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

/**
 * Handle API errors and format them for UI display
 */
const handleApiError = (error: any): Error => {
  if (error.response) {
    const { status, data } = error.response;
    
    // Get the error message from the response data
    const errorMessage = data.message || data.error || 'An error occurred';
    
    switch (status) {
      case 400:
        return new Error(`Invalid request: ${errorMessage}`);
      // case 401:
      //   return new Error(`Authentication failed: ${errorMessage}`);
      case 403:
        return new Error(`Access denied: ${errorMessage}`);
      case 404:
        return new Error(`Not found: ${errorMessage}`);
      case 409:
        return new Error(`Conflict: ${errorMessage}`);
      case 429:
        return new Error('Too many requests. Please try again later.');
      default:
        return new Error(status >= 500 
          ? 'Server error. Please try again later.' 
          : `Error: ${errorMessage}`
        );
    }
  } else if (error.code === 'ECONNABORTED') {
    return new Error('Request timed out. Please check your connection.');
  } else if (error.request) {
    return new Error('No response from server. Please check your internet connection.');
  } else {
    return new Error(`Request failed: ${error.message}`);
  }
};

export class AuthService {
  /**
   * Login a user
   */
  static async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/accounts/login', { 
        username: username.trim(), 
        password: password.trim() 
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Register a new user
   */
  static async register(registerData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post('/accounts/register', {
        ...registerData,
        username: registerData.username.trim(),
        email: registerData.email.trim(),
        password: registerData.password.trim(),
        ...(registerData.full_name && { full_name: registerData.full_name.trim() })
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/accounts/me');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
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
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.put('/accounts/password', {
        current_password: currentPassword.trim(),
        new_password: newPassword.trim()
      });
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Upload profile image
   */
  static async uploadProfileImage(file: File): Promise<{ image_id: string }> {
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
      throw handleApiError(error);
    }
  }

  /**
   * Get user by username
   */
  static async getUserByUsername(username: string): Promise<User> {
    try {
      const response = await api.get(`/accounts/user/${encodeURIComponent(username)}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export default AuthService; 