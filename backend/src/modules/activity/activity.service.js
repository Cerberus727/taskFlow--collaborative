import prisma from '../../config/db.js';

const logActivity = async ({ action, entity, entityId, boardId, userId, metadata }) => {
  const activity = await prisma.activity.create({
    data: {
      action,
      entity,
      entityId,
      boardId,
      userId,
      metadata,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return activity;
};

const getActivities = async ({ boardId, userId, page = 1, limit = 20 }) => {
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

  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where: { boardId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activity.count({ where: { boardId } }),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getEntityActivities = async ({ entity, entityId, userId, page = 1, limit = 10 }) => {
  const activity = await prisma.activity.findFirst({
    where: { entity, entityId },
    include: {
      board: {
        include: {
          members: {
            where: { userId },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!activity || activity.board.members.length === 0) {
    const error = new Error('Entity not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where: { entity, entityId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activity.count({ where: { entity, entityId } }),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getRecentBoardActivity = async (boardId, userId, limit = 10) => {
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

  const activities = await prisma.activity.findMany({
    where: { boardId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return activities;
};

export default { logActivity, getActivities, getEntityActivities, getRecentBoardActivity };
