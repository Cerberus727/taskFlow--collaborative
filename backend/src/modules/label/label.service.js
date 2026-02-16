import prisma from '../../config/db.js';

const createLabel = async ({ boardId, name, color, userId }) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      deletedAt: null,
      members: { some: { userId, role: { in: ['owner', 'admin'] } } },
    },
  });

  if (!board) {
    const error = new Error('Board not found or permission denied');
    error.statusCode = 404;
    throw error;
  }

  return prisma.label.create({
    data: { boardId, name, color },
  });
};

const getBoardLabels = async (boardId, userId) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      deletedAt: null,
      members: { some: { userId } },
    },
  });

  if (!board) {
    const error = new Error('Board not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  return prisma.label.findMany({
    where: { boardId },
    orderBy: { name: 'asc' },
  });
};

const updateLabel = async (labelId, userId, data) => {
  const label = await prisma.label.findFirst({
    where: {
      id: labelId,
      board: {
        deletedAt: null,
        members: { some: { userId, role: { in: ['owner', 'admin'] } } },
      },
    },
  });

  if (!label) {
    const error = new Error('Label not found or permission denied');
    error.statusCode = 404;
    throw error;
  }

  return prisma.label.update({
    where: { id: labelId },
    data: { name: data.name, color: data.color },
  });
};

const deleteLabel = async (labelId, userId) => {
  const label = await prisma.label.findFirst({
    where: {
      id: labelId,
      board: {
        deletedAt: null,
        members: { some: { userId, role: { in: ['owner', 'admin'] } } },
      },
    },
  });

  if (!label) {
    const error = new Error('Label not found or permission denied');
    error.statusCode = 404;
    throw error;
  }

  await prisma.label.delete({ where: { id: labelId } });
  return { boardId: label.boardId };
};

const addLabelToTask = async (taskId, labelId, userId) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      deletedAt: null,
      list: {
        deletedAt: null,
        board: {
          deletedAt: null,
          members: { some: { userId } },
        },
      },
    },
    include: { list: { select: { boardId: true } } },
  });

  if (!task) {
    const error = new Error('Task not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const label = await prisma.label.findFirst({
    where: { id: labelId, boardId: task.list.boardId },
  });

  if (!label) {
    const error = new Error('Label not found');
    error.statusCode = 404;
    throw error;
  }

  const existing = await prisma.taskLabel.findUnique({
    where: { taskId_labelId: { taskId, labelId } },
  });

  if (existing) {
    return { ...existing, label, boardId: task.list.boardId };
  }

  const taskLabel = await prisma.taskLabel.create({
    data: { taskId, labelId },
    include: { label: true },
  });

  return { ...taskLabel, boardId: task.list.boardId };
};

const removeLabelFromTask = async (taskId, labelId, userId) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      deletedAt: null,
      list: {
        deletedAt: null,
        board: {
          deletedAt: null,
          members: { some: { userId } },
        },
      },
    },
    include: { list: { select: { boardId: true } } },
  });

  if (!task) {
    const error = new Error('Task not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  await prisma.taskLabel.deleteMany({
    where: { taskId, labelId },
  });

  return { boardId: task.list.boardId };
};

export default {
  createLabel,
  getBoardLabels,
  updateLabel,
  deleteLabel,
  addLabelToTask,
  removeLabelFromTask,
};
