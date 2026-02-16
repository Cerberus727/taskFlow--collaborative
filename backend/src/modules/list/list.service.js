import prisma from '../../config/db.js';
import activityService from '../activity/activity.service.js';

const createList = async ({ boardId, title, userId }) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      members: {
        some: { userId },
      },
    },
  });

  if (!board) {
    const error = new Error('Board not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const maxPosition = await prisma.list.findFirst({
    where: { boardId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  const position = maxPosition ? maxPosition.position + 1 : 0;

  const list = await prisma.list.create({
    data: {
      title,
      boardId,
      position,
    },
  });

  await activityService.logActivity({
    action: 'created',
    entity: 'list',
    entityId: list.id,
    boardId,
    userId,
    metadata: JSON.stringify({ title }),
  });

  return list;
};

const updateList = async (listId, userId, data) => {
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      board: {
        members: {
          some: { userId },
        },
      },
    },
  });

  if (!list) {
    const error = new Error('List not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const updatedList = await prisma.list.update({
    where: { id: listId },
    data,
  });

  return { ...updatedList, boardId: list.boardId };
};

const moveList = async (listId, userId, newPosition) => {
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      board: {
        members: {
          some: { userId },
        },
      },
    },
  });

  if (!list) {
    const error = new Error('List not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const oldPosition = list.position;

  await prisma.$transaction(async (tx) => {
    if (newPosition > oldPosition) {
      await tx.list.updateMany({
        where: {
          boardId: list.boardId,
          position: {
            gt: oldPosition,
            lte: newPosition,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });
    } else {
      await tx.list.updateMany({
        where: {
          boardId: list.boardId,
          position: {
            gte: newPosition,
            lt: oldPosition,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });
    }

    await tx.list.update({
      where: { id: listId },
      data: { position: newPosition },
    });
  });

  const movedList = await prisma.list.findUnique({
    where: { id: listId },
  });

  return { ...movedList, boardId: list.boardId };
};

const deleteList = async (listId, userId) => {
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      board: {
        members: {
          some: { userId },
        },
      },
    },
  });

  if (!list) {
    const error = new Error('List not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  await prisma.list.delete({
    where: { id: listId },
  });

  await prisma.list.updateMany({
    where: {
      boardId: list.boardId,
      position: {
        gt: list.position,
      },
    },
    data: {
      position: {
        decrement: 1,
      },
    },
  });

  return { boardId: list.boardId };
};

export default { createList, updateList, moveList, deleteList };
