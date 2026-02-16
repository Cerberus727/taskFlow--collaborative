import prisma from '../../config/db.js';

const createBoard = async ({ title, description, ownerId }) => {
  const board = await prisma.board.create({
    data: {
      title,
      description,
      ownerId,
      members: {
        create: {
          userId: ownerId,
          role: 'owner',
        },
      },
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  return board;
};

const getUserBoards = async (userId) => {
  const boards = await prisma.board.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      lists: {
        orderBy: { position: 'asc' },
      },
    },
    orderBy: [
      { isStarred: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return boards;
};

const getBoardById = async (boardId, userId) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      lists: {
        orderBy: { position: 'asc' },
        include: {
          tasks: {
            orderBy: { position: 'asc' },
            include: {
              assignee: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
    },
  });

  if (!board) {
    const error = new Error('Board not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  return board;
};

const updateBoard = async (boardId, userId, data) => {
  const membership = await prisma.boardMember.findFirst({
    where: {
      boardId,
      userId,
      role: { in: ['owner', 'admin'] },
    },
  });

  if (!membership) {
    const error = new Error('Board not found or insufficient permissions');
    error.statusCode = 403;
    throw error;
  }

  const updatedBoard = await prisma.board.update({
    where: { id: boardId },
    data,
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  return updatedBoard;
};

const deleteBoard = async (boardId, userId) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      ownerId: userId,
    },
  });

  if (!board) {
    const error = new Error('Only board owner can delete the board');
    error.statusCode = 403;
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    await tx.taskLabel.deleteMany({
      where: {
        task: {
          list: { boardId },
        },
      },
    });

    await tx.task.deleteMany({
      where: {
        list: { boardId },
      },
    });

    await tx.list.deleteMany({
      where: { boardId },
    });

    await tx.label.deleteMany({
      where: { boardId },
    });

    await tx.comment.deleteMany({
      where: {
        task: {
          list: { boardId },
        },
      },
    });

    await tx.activity.deleteMany({
      where: { boardId },
    });

    await tx.invitation.deleteMany({
      where: { boardId },
    });

    await tx.boardMember.deleteMany({
      where: { boardId },
    });

    await tx.board.delete({
      where: { id: boardId },
    });
  });

  return { success: true, boardId };
};

const addMember = async (boardId, userId, email, role = 'member') => {
  const membership = await prisma.boardMember.findFirst({
    where: {
      boardId,
      userId,
      role: { in: ['owner', 'admin'] },
    },
  });

  if (!membership) {
    const error = new Error('Only owner or admin can add members');
    error.statusCode = 403;
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error('User not found with this email');
    error.statusCode = 404;
    throw error;
  }

  const existingMember = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
  });

  if (existingMember) {
    const error = new Error('User is already a member of this board');
    error.statusCode = 400;
    throw error;
  }

  const member = await prisma.boardMember.create({
    data: {
      boardId,
      userId: user.id,
      role: role === 'admin' ? 'admin' : 'member',
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return member;
};

const updateMemberRole = async (boardId, userId, memberId, newRole) => {
  const board = await prisma.board.findFirst({
    where: { id: boardId, ownerId: userId },
  });

  if (!board) {
    const error = new Error('Only board owner can change roles');
    error.statusCode = 403;
    throw error;
  }

  const member = await prisma.boardMember.findFirst({
    where: { id: memberId, boardId },
  });

  if (!member) {
    const error = new Error('Member not found');
    error.statusCode = 404;
    throw error;
  }

  if (member.role === 'owner') {
    const error = new Error('Cannot change owner role');
    error.statusCode = 400;
    throw error;
  }

  const updatedMember = await prisma.boardMember.update({
    where: { id: memberId },
    data: { role: newRole },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return updatedMember;
};

const removeMember = async (boardId, userId, memberId) => {
  const membership = await prisma.boardMember.findFirst({
    where: {
      boardId,
      userId,
      role: { in: ['owner', 'admin'] },
    },
  });

  if (!membership) {
    const error = new Error('Only owner or admin can remove members');
    error.statusCode = 403;
    throw error;
  }

  const member = await prisma.boardMember.findFirst({
    where: { id: memberId, boardId },
  });

  if (!member) {
    const error = new Error('Member not found');
    error.statusCode = 404;
    throw error;
  }

  if (member.role === 'owner') {
    const error = new Error('Cannot remove board owner');
    error.statusCode = 400;
    throw error;
  }

  await prisma.boardMember.delete({ where: { id: memberId } });
};

const getMemberRole = async (boardId, userId) => {
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  return membership?.role || null;
};

const toggleStar = async (boardId, userId) => {
  const membership = await prisma.boardMember.findFirst({
    where: {
      boardId,
      userId,
    },
  });

  if (!membership) {
    const error = new Error('Board not found or access denied');
    error.statusCode = 403;
    throw error;
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  const updatedBoard = await prisma.board.update({
    where: { id: boardId },
    data: { isStarred: !board.isStarred },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  return updatedBoard;
};

export default {
  createBoard,
  getUserBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  addMember,
  updateMemberRole,
  removeMember,
  getMemberRole,
  toggleStar,
};
