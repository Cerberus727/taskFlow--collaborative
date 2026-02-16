import api from './client';

export const getTasks = async (params) => {
  return await api.get('/tasks', { params });
};

export const searchTasks = async (params) => {
  return await api.get('/tasks/search', { params });
};

export const createTask = async (taskData) => {
  return await api.post('/tasks', taskData);
};

export const updateTask = async (taskId, data) => {
  return await api.put(`/tasks/${taskId}`, data);
};

export const moveTask = async (taskId, data) => {
  return await api.put(`/tasks/${taskId}/move`, data);
};

export const assignTask = async (taskId, assigneeId) => {
  return await api.patch(`/tasks/${taskId}/assign`, { assigneeId });
};

export const deleteTask = async (taskId) => {
  return await api.delete(`/tasks/${taskId}`);
};
