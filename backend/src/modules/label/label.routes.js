import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import {
  createLabel,
  getBoardLabels,
  updateLabel,
  deleteLabel,
  addLabelToTask,
  removeLabelFromTask,
} from './label.controller.js';

const router = Router();

router.use(protect);

router.post('/', createLabel);
router.get('/board/:boardId', getBoardLabels);
router.put('/:id', updateLabel);
router.delete('/:id', deleteLabel);
router.post('/task', addLabelToTask);
router.delete('/task/:taskId/:labelId', removeLabelFromTask);

export default router;
