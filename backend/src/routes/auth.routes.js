import { Router } from 'express';
import { login, signup, refresh, logout, me } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import { authSchema } from '../schemas/auth.schema.js';

const router = Router();

router.use(authLimiter);

router.post('/login', validate(authSchema.login), login);
router.post('/signup', validate(authSchema.signup), signup);
router.post('/refresh', validate(authSchema.refresh), refresh);
router.post('/logout', logout);
router.get('/me', authenticateToken, me);

export default router;
