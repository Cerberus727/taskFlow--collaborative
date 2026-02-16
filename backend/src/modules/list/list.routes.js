import { Router } from 'express';
import * as listController from './list.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/', listController.createList);
router.put('/:id', listController.updateList);
router.put('/:id/move', listController.moveList);
router.delete('/:id', listController.deleteList);

export default router;
