import { Router } from 'express';
import * as userController from './user.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', userController.getUsers);

export default router;
