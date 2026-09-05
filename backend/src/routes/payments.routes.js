import { Router } from 'express';
import {
  createPayment,
  confirmPayment,
  cancelPayment,
  getPayment,
  listPayments,
  listPaymentTargets
} from '../controllers/payments.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { paymentSchema } from '../schemas/payment.schema.js';
import { apiLimiter } from '../middlewares/rateLimit.js';

const router = Router();

router.use(apiLimiter, authenticateToken);

router.get('/targets', listPaymentTargets);
router.get('/', validate(paymentSchema.list), listPayments);
router.get('/:id', validate(paymentSchema.id), getPayment);
router.post('/', validate(paymentSchema.create), createPayment);
router.post('/:id/confirm', requireRole('admin', 'accountant'), validate(paymentSchema.id), confirmPayment);
router.post('/:id/cancel', requireRole('admin', 'accountant'), validate(paymentSchema.id), cancelPayment);

export default router;
