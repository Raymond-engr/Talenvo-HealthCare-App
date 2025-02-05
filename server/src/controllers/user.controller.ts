import { Response } from 'express';
import User from '../models/user.model';
import { NotFoundError } from '../utils/customErrors';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

class UserController {
  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: user
    });
  });
};
  

export const userController = new UserController();