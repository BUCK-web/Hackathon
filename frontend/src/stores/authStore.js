import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  clearError: () => set({ error: null }),

  // Check for existing token on app start
  checkAuthState: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');

      if (token && userData) {
        const user = JSON.parse(userData);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.log('Error checking auth state:', error);
      set({ isLoading: false });
    }
  },

  // Login function
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authAPI.login({ email, password });
      const { token, user } = response.data.data;

      // Validate token and user before storing
      if (token && user) {
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return { success: true };
      } else {
        throw new Error('Missing token or user data in response');
      }
    } catch (error) {
      console.log('Login error:', error.message || error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Register function
  register: async (userData) => {
    try {
      console.log('\n=== FRONTEND REGISTRATION DEBUG START ===');
      console.log('Setting loading state to true');
      set({ isLoading: true, error: null });
      
      console.log('Registration data being sent:', JSON.stringify(userData, null, 2));
      console.log('Making API call to register endpoint...');
      
      const response = await authAPI.register(userData);
      
      console.log('API call completed successfully');
      console.log('Full response object:', JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      }, null, 2));
      
      console.log('Extracting token and user from response...');
      const { token, user } = response.data.data;
      console.log('Extracted token exists:', !!token);
      console.log('Extracted user exists:', !!user);
      console.log('User data:', JSON.stringify(user, null, 2));

      // Validate token and user before storing
      if (token && user) {
        console.log('Storing auth data in AsyncStorage...');
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        console.log('Auth data stored successfully');

        console.log('Updating auth store state...');
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        console.log('Auth store state updated successfully');
        console.log('=== FRONTEND REGISTRATION DEBUG END (SUCCESS) ===\n');

        return { success: true };
      } else {
        console.log('Missing token or user data in response');
        console.log('Token:', token);
        console.log('User:', user);
        throw new Error('Missing token or user data in response');
      }
    } catch (error) {
      console.log('\n=== FRONTEND REGISTRATION ERROR DEBUG START ===');
      console.log('Error type:', typeof error);
      console.log('Error message:', error.message || error);
      console.log('Error stack:', error.stack);
      
      if (error.response) {
        console.log('HTTP Error Response:');
        console.log('Status:', error.response.status);
        console.log('Status Text:', error.response.statusText);
        console.log('Headers:', JSON.stringify(error.response.headers, null, 2));
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.log('Network Error - No response received:');
        console.log('Request:', JSON.stringify(error.request, null, 2));
      } else {
        console.log('Other Error:', error.message);
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      console.log('Final error message:', errorMessage);
      console.log('=== FRONTEND REGISTRATION ERROR DEBUG END ===\n');
      
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Logout function
  logout: async () => {
    try {
      // Call logout API
      await authAPI.logout();
    } catch (error) {
      console.log('Logout API error:', error);
    } finally {
      // Clear local storage regardless of API call result
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Update user function
  updateUser: async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      const updatedUser = response.data.data.user;

      // Validate updatedUser before storing
      if (updatedUser) {
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        set({ user: { ...get().user, ...updatedUser } });

        return { success: true, user: updatedUser };
      } else {
        throw new Error('Missing user data in response');
      }
    } catch (error) {
      console.log('Update user error:', error.message || error);
      const errorMessage = error.response?.data?.message || error.message || 'Update failed';
      return { success: false, error: errorMessage };
    }
  },
}));

export default useAuthStore;