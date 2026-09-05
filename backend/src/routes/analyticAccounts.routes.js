import { Router } from 'express';
import { 
  getAnalyticAccounts,
  getAnalyticAccountById,
  createAnalyticAccount, 
  updateAnalyticAccount,
  deleteAnalyticAccount,
  getAnalyticBudgets 
} from '../controllers/analyticAccounts.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { masterDataSchema } from '../schemas/masterData.schema.js';
import { commonSchema } from '../schemas/common.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validate(masterDataSchema.analyticAccount.list), getAnalyticAccounts);
router.get('/:id', validate(commonSchema.uuidParam), getAnalyticAccountById);
router.post('/', requireRole('admin', 'accountant'), validate(masterDataSchema.analyticAccount.create), createAnalyticAccount);
router.put('/:id', requireRole('admin', 'accountant'), validate(commonSchema.uuidParam), updateAnalyticAccount);
router.delete('/:id', requireRole('admin', 'accountant'), validate(commonSchema.uuidParam), deleteAnalyticAccount);
router.get('/:id/budgets', validate(commonSchema.uuidParam), getAnalyticBudgets);

export default router;
