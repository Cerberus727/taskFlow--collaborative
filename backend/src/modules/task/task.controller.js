import taskService from './task.service.js';
import { getIO } from '../../config/socket.js';

export const createTask = async (req, res, next) => {
  try {
    const { listId, title, description } = req.body;

    if (!listId || !title) {
      res.status(400);
      throw new Error('List ID and title are required');
    }

    const task = await taskService.createTask({
      listId,
      title,
      description,
      userId: req.user.id,
    });

    const io = getIO();
    io.to(task.boardId).emit('task:created', task);

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, labels } = req.body;

    const task = await taskService.updateTaskDetails(id, req.user.id, {
      title,
      description,
      dueDate,
      labels,
    });

    const io = getIO();
    io.to(task.boardId).emit('task:updated', task);

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

export const assignTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;

    const task = await taskService.assignTask(id, req.user.id, assigneeId);

    const io = getIO();
    io.to(task.boardId).emit('task:updated', task);

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

export const moveTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { listId, position } = req.body;

    if (!listId || position === undefined) {
      res.status(400);
      throw new Error('List ID and position are required');
    }

    const task = await taskService.moveTask(id, req.user.id, listId, position);

    const io = getIO();
    io.to(task.boardId).emit('task:moved', {
      taskId: task.id,
      sourceListId: req.body.sourceListId,
      destinationListId: listId,
      position,
      task,
    });

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { boardId } = await taskService.deleteTask(id, req.user.id);

    const io = getIO();
    io.to(boardId).emit('task:deleted', { taskId: id });

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const { listId, boardId, search, page = 1, limit = 50 } = req.query;

    const result = await taskService.getTasks({
      listId,
      boardId,
      search,
      userId: req.user.id,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const searchTasks = async (req, res, next) => {
  try {
    const { q, boardId, page = 1, limit = 20 } = req.query;

    if (!q) {
      res.status(400);
      throw new Error('Search query is required');
    }

    const result = await taskService.getTasks({
      boardId,
      search: q,
      userId: req.user.id,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
