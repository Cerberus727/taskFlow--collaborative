import invitationService from './invitation.service.js';
import { getIO } from '../../config/socket.js';

export const createInvitation = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { email } = req.body;
    const inviterId = req.user.id;

    const invitation = await invitationService.createInvitation(boardId, inviterId, email);

    const io = getIO();
    io.to(invitation.inviteeId).emit('invitation:received', invitation);

    res.status(201).json(invitation);
  } catch (error) {
    next(error);
  }
};

export const getUserInvitations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const invitations = await invitationService.getUserInvitations(userId);
    res.json(invitations);
  } catch (error) {
    next(error);
  }
};

export const acceptInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await invitationService.acceptInvitation(id, userId);

    const io = getIO();
    io.to(result.member.boardId).emit('member:added', result.member);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const rejectInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invitation = await invitationService.rejectInvitation(id, userId);
    res.json(invitation);
  } catch (error) {
    next(error);
  }
};

export const cancelInvitation = async (req, res, next) => {
  try {
    const { boardId, id } = req.params;
    const userId = req.user.id;

    await invitationService.cancelInvitation(id, userId, boardId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
