import prisma from '../../config/db.js';

class InvitationService {
  async createInvitation(boardId, inviterId, inviteeEmail) {
    const invitee = await prisma.user.findUnique({ where: { email: inviteeEmail } });
    if (!invitee) {
      throw new Error('User not found');
    }

    const existingMember = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: invitee.id } }
    });
    if (existingMember) {
      throw new Error('User is already a member');
    }

    const existingInvite = await prisma.invitation.findFirst({
      where: {
        boardId,
        inviteeId: invitee.id,
        status: 'pending'
      }
    });
    if (existingInvite) {
      throw new Error('Invitation already sent');
    }

    const invitation = await prisma.invitation.create({
      data: {
        boardId,
        inviterId,
        inviteeId: invitee.id,
        status: 'pending'
      },
      include: {
        board: { select: { id: true, title: true } },
        inviter: { select: { id: true, name: true, email: true } },
        invitee: { select: { id: true, name: true, email: true } }
      }
    });

    return invitation;
  }

  async getUserInvitations(userId) {
    return await prisma.invitation.findMany({
      where: {
        inviteeId: userId,
        status: 'pending'
      },
      include: {
        board: { select: { id: true, title: true } },
        inviter: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async acceptInvitation(invitationId, userId) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.inviteeId !== userId) {
      throw new Error('Unauthorized');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation already processed');
    }

    const [updatedInvitation, member] = await prisma.$transaction([
      prisma.invitation.update({
        where: { id: invitationId },
        data: { status: 'accepted' }
      }),
      prisma.boardMember.create({
        data: {
          boardId: invitation.boardId,
          userId,
          role: 'member'
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          board: { select: { id: true, title: true } }
        }
      })
    ]);

    return { invitation: updatedInvitation, member };
  }

  async rejectInvitation(invitationId, userId) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.inviteeId !== userId) {
      throw new Error('Unauthorized');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation already processed');
    }

    return await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'rejected' }
    });
  }

  async cancelInvitation(invitationId, userId, boardId) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation || invitation.boardId !== boardId) {
      throw new Error('Invitation not found');
    }

    const member = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } }
    });

    if (!member || member.role === 'member') {
      throw new Error('Unauthorized');
    }

    return await prisma.invitation.delete({
      where: { id: invitationId }
    });
  }
}

export default new InvitationService();
