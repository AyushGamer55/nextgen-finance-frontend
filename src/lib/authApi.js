import axios from 'axios';
import { API_BASE_URL } from './api.js';

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => API.post('/auth/login', { email, password }),
  register: (name, email, password) => API.post('/auth/register', { name, email, password }),
  changePassword: (data) => API.post('/auth/change-password', data),
};

export const userAPI = {
  getMe: () => API.get('/users/me'),
  lookup: (query) => API.get(`/users/lookup?q=${encodeURIComponent(query)}`),
  update: (data) => API.put('/users/update', data),
};

export const transactionAPI = {
  getAll: () => API.get('/transactions'),
  create: (data) => API.post('/transactions', data),
  bulkCreate: (data) => API.post('/transactions/bulk', data),
  update: (id, data) => API.put(`/transactions/${id}`, data),
  remove: (id) => API.delete(`/transactions/${id}`),
  summary: (period = 'month') => API.get(`/transactions/summary?period=${period}`),
};

export const aiAdvisorAPI = {
  chat: (data) => API.post('/ai/chat', data),
};

export const analysisAPI = {
  getMine: () => API.get('/analysis/me'),
};

export const transferAPI = {
  send: (data) => API.post('/transfers/simulate', data),
  history: (page = 1, limit = 10) => API.get(`/transfers/history?page=${page}&limit=${limit}`),
  stats: () => API.get('/transfers/stats'),
};

export const notificationAPI = {
  list: (limit = 40) => API.get(`/notifications?limit=${limit}`),
  markRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllRead: () => API.patch('/notifications/read-all'),
  clear: () => API.delete('/notifications'),
};

export default API;

