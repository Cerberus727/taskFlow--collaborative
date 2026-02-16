import { Router } from 'express';
import * as boardController from './board.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { requireBoardMember, requireBoardAdmin, requireBoardOwner } from '../../middleware/board.middleware.js';

const router = Router();

router.use(protect);

router.post('/', boardController.createBoard);
router.get('/', boardController.getBoards);
router.get('/:id', requireBoardMember, boardController.getBoard);
router.put('/:id', requireBoardAdmin, boardController.updateBoard);
router.delete('/:id', requireBoardOwner, boardController.deleteBoard);
router.patch('/:id/star', requireBoardMember, boardController.toggleStar);

// Member management
router.post('/:id/members', requireBoardAdmin, boardController.addMember);
router.patch('/:id/members/:memberId', requireBoardOwner, boardController.updateMemberRole);
router.delete('/:id/members/:memberId', requireBoardAdmin, boardController.removeMember);

export default router;
