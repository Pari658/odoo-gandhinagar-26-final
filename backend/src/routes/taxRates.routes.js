import { Router } from 'express';
import { getTaxRates, createTaxRate } from '../controllers/taxRates.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getTaxRates);
router.post('/', requireRole('admin', 'accountant'), createTaxRate);

export default router;
