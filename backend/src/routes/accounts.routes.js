import { Router } from 'express';
import { getAccounts, createAccount } from '../controllers/accounts.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAccounts);
router.post('/', requireRole('admin', 'accountant'), createAccount);

export default router;
