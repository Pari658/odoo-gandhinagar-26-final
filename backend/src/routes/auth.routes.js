import { Router } from 'express';
import { login, signup, refresh, logout, me } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticateToken, me);

export default router;
