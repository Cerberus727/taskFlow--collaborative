import prisma from '../../config/db.js';
import activityService from '../activity/activity.service.js';

const createTask = async ({ listId, title, description, priority, dueDate, userId }) => {
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      board: {
        members: {
          some: { userId },
        },
      },
    },
    include: { board: true },
  });

  if (!list) {
    const error = new Error('List not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const maxPosition = await prisma.task.findFirst({
    where: { listId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  const position = maxPosition ? maxPosition.position + 1 : 0;

  const task = await prisma.task.create({
    data: {
      title,
      description,
      listId,
      position,
      priority: priority || 'MEDIUM',
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  await activityService.logActivity({
    action: 'created',
    entity: 'task',
    entityId: task.id,
    boardId: list.boardId,
    userId,
    metadata: JSON.stringify({ title: task.title }),
  });

  return { ...task, boardId: list.boardId };
};

const updateTask = async (taskId, userId, data) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      list: {
        board: {
          members: {
            some: { userId },
          },
        },
      },
    },
    include: {
      list: {
        include: { board: true },
      },
    },
  });

  if (!task) {
    const error = new Error('Task not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  await activityService.logActivity({
    action: 'updated',
    entity: 'task',
    entityId: task.id,
    boardId: task.list.board.id,
    userId,
    metadata: JSON.stringify({ title: updatedTask.title }),
  });

  return { ...updatedTask, boardId: task.list.board.id };
};

const moveTask = async (taskId, userId, newListId, newPosition) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      list: {
        board: {
          members: {
            some: { userId },
          },
        },
      },
    },
    include: {
      list: {
        include: { board: true },
      },
    },
  });

  if (!task) {
    const error = new Error('Task not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const newList = await prisma.list.findFirst({
    where: {
      id: newListId,
      boardId: task.list.board.id,
    },
  });

  if (!newList) {
    const error = new Error('Target list not found');
    error.statusCode = 404;
    throw error;
  }

  const oldListId = task.listId;

  if (oldListId === newListId) {
    await prisma.$transaction(async (tx) => {
      if (newPosition > task.position) {
        await tx.task.updateMany({
          where: {
            listId: oldListId,
            position: {
              gt: task.position,
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
        await tx.task.updateMany({
          where: {
            listId: oldListId,
            position: {
              gte: newPosition,
              lt: task.position,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });
      }

      await tx.task.update({
        where: { id: taskId },
        data: { position: newPosition },
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: {
          listId: oldListId,
          position: {
            gt: task.position,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });

      await tx.task.updateMany({
        where: {
          listId: newListId,
          position: {
            gte: newPosition,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });

      await tx.task.update({
        where: { id: taskId },
        data: {
          listId: newListId,
          position: newPosition,
        },
      });
    });
  }

  const movedTask = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  await activityService.logActivity({
    action: 'moved',
    entity: 'task',
    entityId: task.id,
    boardId: task.list.board.id,
    userId,
    metadata: JSON.stringify({
      title: movedTask.title,
      from: oldListId,
      to: newListId,
    }),
  });

  return { ...movedTask, boardId: task.list.board.id };
};

const deleteTask = async (taskId, userId) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      list: {
        board: {
          members: {
            some: { userId },
          },
        },
      },
    },
    include: {
      list: {
        include: { board: true },
      },
    },
  });

  if (!task) {
    const error = new Error('Task not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  await prisma.task.updateMany({
    where: {
      listId: task.listId,
      position: {
        gt: task.position,
      },
    },
    data: {
      position: {
        decrement: 1,
      },
    },
  });

  await activityService.logActivity({
    action: 'deleted',
    entity: 'task',
    entityId: taskId,
    boardId: task.list.board.id,
    userId,
    metadata: JSON.stringify({ title: task.title }),
  });

  return { boardId: task.list.board.id };
};

const getTasks = async ({ listId, boardId, search, userId, page = 1, limit = 50 }) => {
  const skip = (page - 1) * limit;

  const where = {
    list: {
      board: {
        members: {
          some: { userId },
        },
      },
    },
  };

  if (listId) {
    where.listId = listId;
  }

  if (boardId) {
    where.list = { ...where.list, boardId };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        list: {
          select: { id: true, title: true, boardId: true },
        },
      },
      orderBy: { position: 'asc' },
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const assignTask = async (taskId, userId, assigneeId) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      list: {
        board: {
          members: {
            some: { userId },
          },
        },
      },
    },
    include: {
      list: {
        include: { board: true },
      },
    },
  });

  if (!task) {
    const error = new Error('Task not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  if (assigneeId) {
    const isMember = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId: task.list.boardId, userId: assigneeId } },
    });

    if (!isMember) {
      const error = new Error('Assignee must be a board member');
      error.statusCode = 400;
      throw error;
    }
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  await activityService.logActivity({
    action: 'assigned',
    entity: 'task',
    entityId: task.id,
    boardId: task.list.board.id,
    userId,
    metadata: JSON.stringify({
      title: updatedTask.title,
      assigneeId,
      assigneeName: updatedTask.assignee?.name,
    }),
  });

  return { ...updatedTask, boardId: task.list.board.id };
};

const updateTaskDetails = async (taskId, userId, { title, description, dueDate, priority, labels }) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      list: {
        board: {
          members: {
            some: { userId },
          },
        },
      },
    },
    include: {
      list: {
        include: { board: true },
      },
    },
  });

  if (!task) {
    const error = new Error('Task not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
  if (priority !== undefined) updateData.priority = priority;
  if (labels !== undefined) updateData.labels = labels;

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  await activityService.logActivity({
    action: 'updated',
    entity: 'task',
    entityId: task.id,
    boardId: task.list.board.id,
    userId,
    metadata: JSON.stringify({ title: updatedTask.title, changes: Object.keys(updateData) }),
  });

  return { ...updatedTask, boardId: task.list.board.id };
};

export default {
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  getTasks,
  assignTask,
  updateTaskDetails,
};
