import api from './client';

export const createList = async (listData) => {
  console.log('[listApi.createList] Request:', listData);
  const response = await api.post('/lists', listData);
  console.log('[listApi.createList] Response:', response);
  return response;
};

export const updateList = async (listId, data) => {
  return await api.put(`/lists/${listId}`, data);
};

export const moveList = async (listId, position) => {
  return await api.put(`/lists/${listId}/move`, { position });
};

export const deleteList = async (listId) => {
  return await api.delete(`/lists/${listId}`);
};
