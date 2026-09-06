import { Router } from 'express';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../controllers/accounts.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { masterDataSchema } from '../schemas/masterData.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validate(masterDataSchema.account.list), getAccounts);
router.post('/', requireRole('admin', 'accountant'), validate(masterDataSchema.account.create), createAccount);
router.put('/:id', requireRole('admin', 'accountant'), validate(masterDataSchema.account.update), updateAccount);
router.delete('/:id', requireRole('admin', 'accountant'), validate(masterDataSchema.account.getById), deleteAccount);

export default router;
