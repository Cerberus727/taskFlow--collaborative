import api from './client';

export const getUsers = async (search) => {
  return await api.get('/users', { params: { search } });
};
