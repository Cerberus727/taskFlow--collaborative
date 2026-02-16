import api from './client';

export const login = async (credentials) => {
  return await api.post('/auth/login', credentials);
};

export const register = async (userData) => {
  return await api.post('/auth/register', userData);
};

export const getProfile = async () => {
  return await api.get('/auth/profile');
};
