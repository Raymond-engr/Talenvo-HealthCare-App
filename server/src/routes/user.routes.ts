import { Router } from 'express';
import { authenticateToken, rateLimiter } from '../middleware/auth.middleware';
import { userController } from '../controllers/user.controller';

const router = Router();

const standardLimit = rateLimiter(20, 15 * 60 * 1000);

router.get('/me', authenticateToken, standardLimit, userController.getCurrentUser);


export default router;