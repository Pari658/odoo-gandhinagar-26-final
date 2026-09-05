import { Router } from 'express';
import { getCustomerInvoices } from '../controllers/customerInvoices.controller.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { commonSchema } from '../schemas/common.schema.js';

const router = Router();

router.use(authenticateToken);
router.get('/', validate(commonSchema.paginationQuery), getCustomerInvoices);

export default router;
