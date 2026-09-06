import { Router } from 'express';
import { getTaxRates, createTaxRate, updateTaxRate, deleteTaxRate } from '../controllers/taxRates.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { masterDataSchema } from '../schemas/masterData.schema.js';
import { commonSchema } from '../schemas/common.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validate(masterDataSchema.taxRate.list), getTaxRates);
router.post('/', requireRole('admin', 'accountant'), validate(masterDataSchema.taxRate.create), createTaxRate);
router.put('/:id', requireRole('admin', 'accountant'), validate(masterDataSchema.taxRate.update), updateTaxRate);
router.delete('/:id', requireRole('admin', 'accountant'), validate(masterDataSchema.taxRate.getById), deleteTaxRate);

export default router;
