import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { getMyBills, getCustomerInvoices } from '../controllers/customerInvoices.controller.js';

const router = Router();

router.use(authenticateToken);

// Customer Portal Endpoint (Customer can only view their own bills)
router.get('/my-bills', getMyBills);

// Staff Endpoint
router.get('/', getCustomerInvoices);

export default router;
