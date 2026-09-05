import { Router } from 'express';
import {
  getPurchaseOrders,
  createPurchaseOrder,
  confirmPurchaseOrder,
  createBillFromPO
} from '../controllers/purchaseOrders.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { purchaseOrderSchema } from '../schemas/purchaseOrder.schema.js';
import { commonSchema } from '../schemas/common.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validate(commonSchema.paginationQuery), getPurchaseOrders);
router.post('/', requireRole('admin', 'accountant'), validate(purchaseOrderSchema.create), createPurchaseOrder);
router.post('/:id/confirm', requireRole('admin', 'accountant'), validate(commonSchema.uuidParam), confirmPurchaseOrder);
router.post('/:id/create-bill', requireRole('admin', 'accountant'), validate(purchaseOrderSchema.createBill), createBillFromPO);

export default router;
