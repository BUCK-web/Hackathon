import { apiInstance as api, API_BASE_URL } from '../utils/apiConfig';

// Export the base URL for reference
export { API_BASE_URL };

// Auth API functions
export const authAPI = {
  register: async (userData) => {
    console.log('\n=== API SERVICE REGISTER DEBUG START ===');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Register endpoint: /auth/register');
    console.log('User data to send:', JSON.stringify(userData, null, 2));
    
    try {
      console.log('Making POST request to /auth/register...');
      const response = await api.post('/auth/register', userData);
      console.log('API request successful');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      console.log('=== API SERVICE REGISTER DEBUG END (SUCCESS) ===\n');
      return response;
    } catch (error) {
      console.log('\n=== API SERVICE REGISTER ERROR DEBUG START ===');
      console.log('API request failed');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Error response status:', error.response.status);
        console.log('Error response data:', JSON.stringify(error.response.data, null, 2));
      }
      console.log('=== API SERVICE REGISTER ERROR DEBUG END ===\n');
      throw error;
    }
  },
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
};

// Users API functions
export const usersAPI = {
  getUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  uploadProfileImage: (formData) => {
    return api.put('/users/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Products API functions
export const productsAPI = {
  getProducts: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add query parameters if they exist
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.category && params.category !== 'All') queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.organic) queryParams.append('organic', params.organic);
    if (params.locallyGrown) queryParams.append('locallyGrown', params.locallyGrown);
    if (params.seller) queryParams.append('seller', params.seller);
    
    const queryString = queryParams.toString();
    return api.get(`/products${queryString ? '?' + queryString : ''}`);
  },
  getCategories: () => api.get('/products/categories'),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  addReview: (id, reviewData) => api.post(`/products/${id}/reviews`, reviewData),
  getSellerProducts: (sellerId) => api.get(`/products/seller/${sellerId}`),
};

// Orders API functions
export const ordersAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    return api.get(`/orders${queryString ? '?' + queryString : ''}`);
  },
  getOrderById: (orderId) => api.get(`/orders/${orderId}`),
  updateOrderStatus: (orderId, statusData) => api.put(`/orders/${orderId}/status`, statusData),
  processPayment: (orderId, paymentData) => api.post(`/orders/${orderId}/payment`, paymentData),
  cancelOrder: (orderId, reason) => api.post(`/orders/${orderId}/cancel`, { reason }),
};

export default api;