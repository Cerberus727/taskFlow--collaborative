import { Router } from 'express';
import * as activityController from './activity.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/board/:boardId', activityController.getActivities);
router.get('/board/:boardId/recent', activityController.getRecentActivity);
router.get('/entity/:entity/:entityId', activityController.getEntityActivities);

export default router;
