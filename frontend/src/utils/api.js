import axios from 'axios';

// Create an Axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add to headers
    if (token) {
      config.headers['x-auth-token'] = token;
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    try {
      const response = await api.post('/api/users/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  login: async (userData) => {
    try {
      console.log('API login called with:', userData);
      const response = await api.post('/api/auth/login', userData);
      console.log('API login response:', response);
      return response.data;
    } catch (error) {
      console.error('API login error:', error);
      throw error;
    }
  },
  
  loadUser: async () => {
    try {
      const response = await api.get('/api/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// User API
export const userAPI = {
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (userData) => api.put('/api/users/profile', userData),
  updatePassword: (passwordData) => api.put('/api/users/password', passwordData),
  deleteAccount: () => api.delete('/api/users'),
  getDashboard: () => api.get('/api/users/dashboard')
};

// API Management API
export const apiManagementAPI = {
  getApis: () => api.get('/api/apis'),
  getApi: (id) => api.get(`/api/apis/${id}`),
  createApi: (apiData) => api.post('/api/apis', apiData),
  updateApi: (id, apiData) => api.put(`/api/apis/${id}`, apiData),
  deleteApi: (id) => api.delete(`/api/apis/${id}`),
  getApiHistory: (id, queryString = '') => api.get(`/api/apis/${id}/history${queryString}`),
  checkApi: (id) => api.post(`/api/apis/${id}/check`),
  getAllStatus: () => api.get('/api/apis/status')
};

export default api; 