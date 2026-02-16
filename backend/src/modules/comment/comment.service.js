import prisma from '../../config/db.js';

const createComment = async ({ taskId, content, userId }) => {
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

  const comment = await prisma.comment.create({
    data: { taskId, content, userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return { ...comment, boardId: task.list.boardId };
};

const getComments = async (taskId, userId, page = 1, limit = 20) => {
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
  });

  if (!task) {
    const error = new Error('Task not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const skip = (page - 1) * limit;
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.comment.count({ where: { taskId } }),
  ]);

  return {
    comments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

const updateComment = async (commentId, userId, content) => {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, userId },
    include: { task: { include: { list: { select: { boardId: true } } } } },
  });

  if (!comment) {
    const error = new Error('Comment not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return { ...updated, boardId: comment.task.list.boardId };
};

const deleteComment = async (commentId, userId) => {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, userId },
    include: { task: { include: { list: { select: { boardId: true } } } } },
  });

  if (!comment) {
    const error = new Error('Comment not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return { boardId: comment.task.list.boardId, taskId: comment.taskId };
};

export default { createComment, getComments, updateComment, deleteComment };
