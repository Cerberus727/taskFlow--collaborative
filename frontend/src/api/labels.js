import api from './client';

export const labelApi = {
  create: (data) => api.post('/labels', data),
  getByBoard: (boardId) => api.get(`/labels/board/${boardId}`),
  update: (id, data) => api.put(`/labels/${id}`, data),
  delete: (id) => api.delete(`/labels/${id}`),
  addToTask: (taskId, labelId) => api.post('/labels/task', { taskId, labelId }),
  removeFromTask: (taskId, labelId) => api.delete(`/labels/task/${taskId}/${labelId}`),
};
