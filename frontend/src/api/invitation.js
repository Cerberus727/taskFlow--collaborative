import api from './client';

export const getInvitations = async () => {
  return await api.get('/invitations');
};

export const acceptInvitation = async (invitationId) => {
  return await api.post(`/invitations/${invitationId}/accept`);
};

export const rejectInvitation = async (invitationId) => {
  return await api.post(`/invitations/${invitationId}/reject`);
};

export const createInvitation = async (boardId, email) => {
  return await api.post(`/boards/${boardId}/invitations`, { email });
};

export const cancelInvitation = async (boardId, invitationId) => {
  return await api.delete(`/boards/${boardId}/invitations/${invitationId}`);
};
