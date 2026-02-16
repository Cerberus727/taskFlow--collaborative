import authService from './auth.service.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    const result = await authService.register({ email, password, name });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
