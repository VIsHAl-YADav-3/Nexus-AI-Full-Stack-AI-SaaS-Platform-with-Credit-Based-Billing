import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT token to every outgoing request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Globally handle 401s by clearing the session; UI layer decides on redirect.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_user');
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const signupRequest = (payload) => api.post('/auth/signup', payload);
export const loginRequest = (payload) => api.post('/auth/login', payload);
export const getMeRequest = () => api.get('/auth/me');
export const forgotPasswordRequest = (payload) => api.post('/auth/forgot-password', payload);
export const resetPasswordRequest = (payload) => api.post('/auth/reset-password', payload);

// --- Personas & Templates ---
export const getPersonasRequest = () => api.get('/personas');
export const getTemplatesRequest = (params) => api.get('/templates', { params });

// --- Payments ---
export const createOrderRequest = (payload) => api.post('/payments/create-order', payload);
export const verifyPaymentRequest = (payload) => api.post('/payments/verify', payload);
export const getPaymentHistoryRequest = () => api.get('/payments/history');

// --- Analytics ---
export const getAnalyticsRequest = () => api.get('/analytics');

// --- Conversations (persistent chat history) ---
export const createConversationRequest = (payload) => api.post('/conversations', payload);
export const getConversationsRequest = () => api.get('/conversations');
export const getConversationRequest = (id) => api.get(`/conversations/${id}`);
export const updateConversationRequest = (id, payload) => api.put(`/conversations/${id}`, payload);
export const deleteConversationRequest = (id) => api.delete(`/conversations/${id}`);

export { BASE_URL };
export default api;
