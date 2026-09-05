import { Router } from 'express';
import {
  createPayment,
  confirmPayment,
  cancelPayment
} from '../controllers/payments.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { paymentSchema } from '../schemas/payment.schema.js';
import { commonSchema } from '../schemas/common.schema.js';

const router = Router();

router.use(authenticateToken);

router.post('/', requireRole('admin', 'accountant'), validate(paymentSchema.create), createPayment);
router.post('/:id/confirm', requireRole('admin', 'accountant'), validate(commonSchema.uuidParam), confirmPayment);
router.post('/:id/cancel', requireRole('admin', 'accountant'), validate(commonSchema.uuidParam), cancelPayment);

export default router;
