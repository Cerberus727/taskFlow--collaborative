import express from 'express';
import * as invitationController from './invitation.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { requireBoardAdmin } from '../../middleware/board.middleware.js';

const router = express.Router();

router.post('/boards/:boardId/invitations', protect, requireBoardAdmin, invitationController.createInvitation);
router.delete('/boards/:boardId/invitations/:id', protect, requireBoardAdmin, invitationController.cancelInvitation);

router.get('/invitations', protect, invitationController.getUserInvitations);
router.post('/invitations/:id/accept', protect, invitationController.acceptInvitation);
router.post('/invitations/:id/reject', protect, invitationController.rejectInvitation);

export default router;
