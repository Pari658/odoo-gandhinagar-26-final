import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import {
  handleCreateSalesOrder,
  handleGetSalesOrders,
  handleGetSalesOrderById,
  handleConfirmSalesOrder,
  handleUpdateSalesOrder,
  handleInvoiceSalesOrder,
} from '../controllers/salesOrders.controller.js';

const router = Router();

router.use(authenticateToken);

// Read endpoints (accessible to all authenticated roles including contacts/customers)
router.get('/', handleGetSalesOrders);
router.get('/:id', handleGetSalesOrderById);

// Mutation endpoints (restricted to admin & accountant roles)
router.post('/', requireRole('admin', 'accountant'), handleCreateSalesOrder);
router.put('/:id', requireRole('admin', 'accountant'), handleUpdateSalesOrder);
router.post('/:id/confirm', requireRole('admin', 'accountant'), handleConfirmSalesOrder);
router.post('/:id/invoice', requireRole('admin', 'accountant'), handleInvoiceSalesOrder);

export default router;
