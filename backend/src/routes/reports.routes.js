import { Router } from 'express';
import { 
  getBalanceSheet, 
  getProfitAndLoss, 
  getOverallReport,
  seedDemoTransactions, 
  seedDemoPnlTransactions 
} from '../controllers/reports.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

// Reports are strictly restricted to admin and accountant only
router.use(authenticateToken);
router.use(requireRole('admin', 'accountant'));

router.get('/overall', getOverallReport);
router.get('/balance-sheet', getBalanceSheet);
router.get('/profit-and-loss', getProfitAndLoss);
router.post('/seed-demo-transactions', seedDemoTransactions);
router.post('/seed-demo-pnl-transactions', seedDemoPnlTransactions);

export default router;
