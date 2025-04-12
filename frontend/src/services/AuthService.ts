import api from './api';
import { User, RegisterData } from '../interfaces';

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

/**
 * Handle API errors and format them for UI display
 */
const handleApiError = (error: any): Error => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { status, data } = error.response;
    
    if (status === 400) {
      // Bad request - validation errors
      if (data.message) {
        return new Error(data.message);
      }
      return new Error('Invalid input data. Please check your information and try again.');
    } else if (status === 401) {
      // Unauthorized
      return new Error('Authentication failed. ' + (data.message || 'Please check your credentials.'));
    } else if (status === 404) {
      // Not found
      return new Error('Resource not found. ' + (data.message || 'Please try again later.'));
    } else if (status >= 500) {
      // Server error
      return new Error('Server error. Please try again later.');
    }
    
    // Other status codes
    return new Error(data.message || 'An error occurred. Please try again.');
  } else if (error.request) {
    // The request was made but no response was received
    return new Error('No response from server. Please check your internet connection.');
  } else {
    // Something happened in setting up the request that triggered an Error
    return new Error('Request error: ' + error.message);
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
      const response = await api.post('/accounts/register', registerData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Check if token is valid
   */
  static async validateToken(token: string): Promise<boolean> {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await api.get('/accounts/me');
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
}

export default AuthService; 