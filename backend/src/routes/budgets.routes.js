import { Router } from 'express';
import { 
  getBudgets, 
  getBudgetById,
  createBudget, 
  updateBudget,
  updateBudgetStatus,
  confirmBudget, 
  cancelBudget,
  reviseBudget,
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
router.get('/:id', requireRole('admin', 'accountant'), getBudgetById);
router.post('/', requireRole('admin', 'accountant'), createBudget);
router.put('/:id', requireRole('admin', 'accountant'), updateBudget);
router.patch('/:id/confirm', requireRole('admin', 'accountant'), confirmBudget);
router.patch('/:id/cancel', requireRole('admin', 'accountant'), cancelBudget);
router.patch('/:id/status', requireRole('admin', 'accountant'), updateBudgetStatus);
router.post('/:id/revise', requireRole('admin', 'accountant'), reviseBudget);
router.post('/seed-demo', requireRole('admin', 'accountant'), seedDemoBudgets);

export default router;
