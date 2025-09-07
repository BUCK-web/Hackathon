import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL configuration
export const API_BASE_URL = 'http://192.168.1.51:5000/api';

// Create and configure axios instance
const createApiInstance = () => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  api.interceptors.request.use(
    async (config) => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.log('Error getting token:', error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle errors
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid, clear storage
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
      }
      return Promise.reject(error);
    }
  );

  return api;
};

// Export configured axios instance
export const apiInstance = createApiInstance();

// Export default instance
export default apiInstance;