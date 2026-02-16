import { Router } from 'express';
import * as taskController from './task.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/search', taskController.searchTasks);
router.put('/:id', taskController.updateTask);
router.patch('/:id/assign', taskController.assignTask);
router.put('/:id/move', taskController.moveTask);
router.delete('/:id', taskController.deleteTask);

export default router;
