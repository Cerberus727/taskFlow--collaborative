import api from './client';

export const getActivities = async (boardId, page = 1, limit = 20) => {
  return await api.get(`/activities/board/${boardId}`, {
    params: { page, limit },
  });
};

export const getRecentActivities = async (boardId, limit = 10) => {
  return await api.get(`/activities/board/${boardId}/recent`, {
    params: { limit },
  });
};

export const getEntityActivities = async (entity, entityId, page = 1, limit = 10) => {
  return await api.get(`/activities/entity/${entity}/${entityId}`, {
    params: { page, limit },
  });
};
