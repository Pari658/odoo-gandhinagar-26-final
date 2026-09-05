import { Router } from 'express';
import { getAccounts, createAccount } from '../controllers/accounts.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { masterDataSchema } from '../schemas/masterData.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validate(masterDataSchema.account.list), getAccounts);
router.post('/', requireRole('admin', 'accountant'), validate(masterDataSchema.account.create), createAccount);

export default router;
