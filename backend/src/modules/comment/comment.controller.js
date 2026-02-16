import commentService from './comment.service.js';
import { getIO } from '../../config/socket.js';

export const createComment = async (req, res, next) => {
  try {
    const { taskId, content } = req.body;

    if (!taskId || !content) {
      res.status(400);
      throw new Error('Task ID and content are required');
    }

    const comment = await commentService.createComment({
      taskId,
      content,
      userId: req.user.id,
    });

    getIO().to(comment.boardId).emit('comment:created', comment);
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await commentService.getComments(
      taskId,
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400);
      throw new Error('Content is required');
    }

    const comment = await commentService.updateComment(id, req.user.id, content);
    getIO().to(comment.boardId).emit('comment:updated', comment);
    res.status(200).json(comment);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await commentService.deleteComment(id, req.user.id);
    getIO().to(result.boardId).emit('comment:deleted', { commentId: id, taskId: result.taskId });
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
