import api from './client';

export const getBoards = async () => {
  return await api.get('/boards');
};

export const getBoard = async (boardId) => {
  return await api.get(`/boards/${boardId}`);
};

export const createBoard = async (boardData) => {
  return await api.post('/boards', boardData);
};

export const updateBoard = async (boardId, data) => {
  return await api.put(`/boards/${boardId}`, data);
};

export const deleteBoard = async (boardId) => {
  return await api.delete(`/boards/${boardId}`);
};

export const toggleStarBoard = async (boardId) => {
  return await api.patch(`/boards/${boardId}/star`);
};

export const addMember = async (boardId, memberData) => {
  return await api.post(`/boards/${boardId}/members`, memberData);
};
