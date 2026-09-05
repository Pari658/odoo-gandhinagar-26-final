import { Router } from 'express';
import { getTaxRates, createTaxRate } from '../controllers/taxRates.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { masterDataSchema } from '../schemas/masterData.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validate(masterDataSchema.taxRate.list), getTaxRates);
router.post('/', requireRole('admin', 'accountant'), validate(masterDataSchema.taxRate.create), createTaxRate);

export default router;
