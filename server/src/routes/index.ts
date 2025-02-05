import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import healthcareSearchRoutes from '../Healthcare_Centre_Search/routes/HealthcareSearch.routes';
import { authenticateToken, rateLimiter } from '../middleware/auth.middleware';

const router = Router();

const standardLimit = rateLimiter(20, 15 * 60 * 1000);

router.use('/auth', authRoutes);
router.use('/user', authenticateToken, userRoutes);
router.use('/search', standardLimit, authenticateToken, healthcareSearchRoutes);

export default router;