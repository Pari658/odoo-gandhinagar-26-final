import { Router } from 'express';
import {
  getVendorBills,
  getVendorBillById,
  createVendorBill,
  confirmVendorBill,
  deleteVendorBill
} from '../controllers/vendorBills.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { vendorBillSchema } from '../schemas/vendorBill.schema.js';
import { commonSchema } from '../schemas/common.schema.js';

const router = Router();

router.use(authenticateToken);

// Contact portal and admin view share the same endpoint, controller handles filtering
router.get('/', validate(commonSchema.paginationQuery), getVendorBills);
router.get('/:id', validate(commonSchema.uuidParam), getVendorBillById);
router.post('/', requireRole('admin', 'accountant'), validate(vendorBillSchema.create), createVendorBill);
router.post('/:id/confirm', requireRole('admin', 'accountant'), validate(commonSchema.uuidParam), confirmVendorBill);
router.delete('/:id', requireRole('admin', 'accountant'), validate(commonSchema.uuidParam), deleteVendorBill);

export default router;
