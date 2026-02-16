import activityService from './activity.service.js';

export const getActivities = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const activities = await activityService.getActivities({
      boardId,
      userId: req.user.id,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
};

export const getEntityActivities = async (req, res, next) => {
  try {
    const { entity, entityId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const activities = await activityService.getEntityActivities({
      entity,
      entityId,
      userId: req.user.id,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { limit = 10 } = req.query;

    const activities = await activityService.getRecentBoardActivity(
      boardId,
      req.user.id,
      parseInt(limit)
    );

    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
};
