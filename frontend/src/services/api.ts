import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Enable request debugging in development
if (process.env.NODE_ENV === 'development') {
  api.interceptors.request.use(request => {
    console.log('API Request:', {
      url: request.url,
      method: request.method,
      data: request.data,
      headers: request.headers
    });
    return request;
  });
}

// Event to notify authentication status changes
export const authEvent = new EventTarget();

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle common error scenarios
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        // Don't clear token for prompt/repository access - only for actual expired tokens
        // This allows viewing public repo prompts while keeping authorization for private ones
        if (!error.config.url?.includes('/accounts/login') && 
            !error.config.url?.includes('/prompts/') && 
            !error.config.url?.includes('/repositories/')) {
          localStorage.removeItem('token');
          // Dispatch event to notify auth context
          authEvent.dispatchEvent(new Event('logout'));
        }
      }

      // Add custom error message based on status code
      if (status === 403) {
        error.message = 'You do not have permission to perform this action';
      } else if (status === 404) {
        error.message = 'The requested resource was not found';
      } else if (status === 429) {
        error.message = 'Too many requests. Please try again later';
      } else if (status >= 500) {
        error.message = 'An internal server error occurred. Please try again later';
      }
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please check your connection';
    }
    
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      });
    }
    
    return Promise.reject(error);
  }
);

export default api; 