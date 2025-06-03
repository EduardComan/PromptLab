import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { User, RegisterData } from '../interfaces';
import AuthService from '../services/AuthService';
import UserService from '../services/UserService';
import { authEvent } from '../services/api';

// Define the AuthContextType
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (registerData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Create the Auth Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Configure axios
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Check if token is valid and load user on app start
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Check if token is expired
          const decodedToken: any = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // Token expired
            console.log('Token expired, logging out...');
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
          } else {
            // Valid token, load user
            console.log('Valid token, loading user data...');
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            try {
              const userData = await UserService.getCurrentUser();
              console.log('User data loaded:', userData);
              
              if (!userData) {
                throw new Error('No user data returned from server');
              }
              
              setUser(userData);
            } catch (error) {
              console.error('Error loading user data:', error);
              // Token valid but can't get user data, clear token
              localStorage.removeItem('token');
              setToken(null);
              setUser(null);
              delete axios.defaults.headers.common['Authorization'];
            }
          }
        } catch (err) {
          // Invalid token
          console.error('Invalid token:', err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          delete axios.defaults.headers.common['Authorization'];
        }
      } else {
        setIsLoading(false);
      }
      setIsLoading(false);
    };

    loadUser();
  }, [token]);

  // Add useEffect to listen for logout events
  useEffect(() => {
    // Listen for logout events from API service
    const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('token');
    };
    
    authEvent.addEventListener('logout', handleLogout);
    
    return () => {
      authEvent.removeEventListener('logout', handleLogout);
    };
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setError(null);
    try {
      const response = await AuthService.login(username, password);
      const { token: newToken, user: userData } = response;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      console.error('Login error:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  // Register function
  const register = async (registerData: RegisterData) => {
    setError(null);
    try {
      const response = await AuthService.register(registerData);
      const { token: newToken, user: userData } = response;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed. Please try with different information.';
      console.error('Registration error:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Update user data
  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUser });
    }
  };

  const value = {
    user,
    token,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 