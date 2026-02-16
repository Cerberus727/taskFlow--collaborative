import { Router } from 'express';
import * as authController from './auth.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', protect, authController.getProfile);

export default router;
