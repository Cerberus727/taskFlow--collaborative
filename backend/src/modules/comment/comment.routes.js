import { Router } from 'express';
import * as commentController from './comment.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/', commentController.createComment);
router.get('/task/:taskId', commentController.getComments);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

export default router;
