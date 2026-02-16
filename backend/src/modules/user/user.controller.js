import userService from './user.service.js';

export const getUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const users = await userService.getUsers(search);
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};
