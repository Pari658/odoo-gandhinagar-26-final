import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import {
  handleCreateSalesOrder,
  handleGetSalesOrders,
  handleGetSalesOrderById,
  handleConfirmSalesOrder,
  handleUpdateSalesOrder,
} from '../controllers/salesOrders.controller.js';

const router = Router();

// Secure all Sales Order routes (only admin and accountant can manage SOs)
router.use(authenticateToken, requireRole('admin', 'accountant'));

router.post('/', handleCreateSalesOrder);
router.get('/', handleGetSalesOrders);
router.get('/:id', handleGetSalesOrderById);
router.put('/:id', handleUpdateSalesOrder);
router.post('/:id/confirm', handleConfirmSalesOrder);

export default router;
