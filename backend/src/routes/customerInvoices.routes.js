import { Router } from 'express';
import { getCustomerInvoices, getMyBills } from '../controllers/customerInvoices.controller.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { commonSchema } from '../schemas/common.schema.js';

const router = Router();

router.use(authenticateToken);
router.get('/my-bills', getMyBills);
router.get('/', validate(commonSchema.paginationQuery), getCustomerInvoices);

export default router;
