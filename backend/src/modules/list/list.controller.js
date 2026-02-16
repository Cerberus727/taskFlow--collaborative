import listService from './list.service.js';
import { getIO } from '../../config/socket.js';

export const createList = async (req, res, next) => {
  try {
    const { boardId, title } = req.body;

    if (!boardId || !title) {
      res.status(400);
      throw new Error('Board ID and title are required');
    }

    const list = await listService.createList({
      boardId,
      title,
      userId: req.user.id,
    });

    getIO().to(boardId).emit('list:created', list);

    res.status(201).json(list);
  } catch (error) {
    next(error);
  }
};

export const updateList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const list = await listService.updateList(id, req.user.id, { title });
    
    getIO().to(list.boardId).emit('list:updated', list);

    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

export const moveList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    if (position === undefined) {
      res.status(400);
      throw new Error('Position is required');
    }

    const list = await listService.moveList(id, req.user.id, position);

    getIO().to(list.boardId).emit('list:moved', {
      listId: list.id,
      position: list.position,
      boardId: list.boardId,
    });

    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

export const deleteList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await listService.deleteList(id, req.user.id);
    
    getIO().to(result.boardId).emit('list:deleted', { listId: id, boardId: result.boardId });

    res.status(200).json({ message: 'List deleted successfully' });
  } catch (error) {
    next(error);
  }
};
