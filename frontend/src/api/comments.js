import api from './client';

export const commentApi = {
  create: (data) => api.post('/comments', data),
  getByTask: (taskId, page = 1, limit = 20) =>
    api.get(`/comments/task/${taskId}?page=${page}&limit=${limit}`),
  update: (id, content) => api.put(`/comments/${id}`, { content }),
  delete: (id) => api.delete(`/comments/${id}`),
};
