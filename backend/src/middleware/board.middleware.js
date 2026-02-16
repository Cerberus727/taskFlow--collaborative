import prisma from '../config/db.js';

export const requireBoardAccess = (requiredRoles = null) => {
  return async (req, res, next) => {
    try {
      const boardId = req.params.boardId || req.params.id || req.body.boardId;
      
      if (!boardId) {
        return res.status(400).json({ message: 'Board ID is required' });
      }

      const membership = await prisma.boardMember.findFirst({
        where: {
          boardId,
          userId: req.user.id,
          board: {
            deletedAt: null,
          },
        },
        include: {
          board: true,
        },
      });

      if (!membership) {
        return res.status(403).json({ message: 'You do not have access to this board' });
      }

      if (requiredRoles && !requiredRoles.includes(membership.role)) {
        return res.status(403).json({ message: 'Insufficient permissions for this action' });
      }

      req.board = membership.board;
      req.membership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireBoardOwner = requireBoardAccess(['owner']);
export const requireBoardAdmin = requireBoardAccess(['owner', 'admin']);
export const requireBoardMember = requireBoardAccess(['owner', 'admin', 'member']);
