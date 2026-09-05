import { Router } from 'express';
import { 
  getBudgets, 
  createBudget, 
  confirmBudget, 
  checkBudget, 
  seedDemoBudgets 
} from '../controllers/budgets.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(authenticateToken);

// Dev 2 PO Screen ping (available to any authenticated operational user)
router.get('/check', checkBudget);

// Budget management and reports restricted to admin and accountant
router.get('/', requireRole('admin', 'accountant'), getBudgets);
router.post('/', requireRole('admin', 'accountant'), createBudget);
router.patch('/:id/confirm', requireRole('admin', 'accountant'), confirmBudget);
router.post('/seed-demo', requireRole('admin', 'accountant'), seedDemoBudgets);

export default router;
