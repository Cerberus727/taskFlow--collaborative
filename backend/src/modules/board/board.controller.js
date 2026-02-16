import boardService from './board.service.js';
import activityService from '../activity/activity.service.js';
import { getIO } from '../../config/socket.js';

export const createBoard = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      res.status(400);
      throw new Error('Board title is required');
    }

    const board = await boardService.createBoard({
      title,
      description,
      ownerId: req.user.id,
    });

    res.status(201).json(board);
  } catch (error) {
    next(error);
  }
};

export const getBoards = async (req, res, next) => {
  try {
    const boards = await boardService.getUserBoards(req.user.id);
    res.status(200).json(boards);
  } catch (error) {
    next(error);
  }
};

export const getBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const board = await boardService.getBoardById(id, req.user.id);
    res.status(200).json(board);
  } catch (error) {
    next(error);
  }
};

export const updateBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const board = await boardService.updateBoard(id, req.user.id, {
      title,
      description,
    });

    getIO().to(id).emit('board-updated', board);
    res.status(200).json(board);
  } catch (error) {
    next(error);
  }
};

export const deleteBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await boardService.deleteBoard(id, req.user.id);
    getIO().to(id).emit('board-deleted', { boardId: id });
    res.status(200).json({ success: true, boardId: id, message: 'Board deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const member = await boardService.addMember(id, req.user.id, email, role);
    
    await activityService.logActivity({
      action: 'member_added',
      entity: 'member',
      entityId: member.id,
      boardId: id,
      userId: req.user.id,
      metadata: JSON.stringify({ email, role: member.role }),
    });

    getIO().to(id).emit('member-added', member);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'member'].includes(role)) {
      res.status(400);
      throw new Error('Valid role is required (admin or member)');
    }

    const member = await boardService.updateMemberRole(id, req.user.id, memberId, role);
    getIO().to(id).emit('member-updated', member);
    res.status(200).json(member);
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;
    await boardService.removeMember(id, req.user.id, memberId);
    getIO().to(id).emit('member-removed', { memberId, boardId: id });
    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const toggleStar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const board = await boardService.toggleStar(id, req.user.id);
    getIO().to(id).emit('board-updated', board);
    res.status(200).json(board);
  } catch (error) {
    next(error);
  }
};
