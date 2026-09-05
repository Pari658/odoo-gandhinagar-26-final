import { Router } from 'express';
import { 
  getAnalyticAccounts, 
  createAnalyticAccount, 
  getAnalyticBudgets 
} from '../controllers/analyticAccounts.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAnalyticAccounts);
router.post('/', requireRole('admin', 'accountant'), createAnalyticAccount);
router.get('/:id/budgets', getAnalyticBudgets);

export default router;
