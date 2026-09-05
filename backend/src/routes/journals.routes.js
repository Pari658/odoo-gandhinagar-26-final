import { Router } from 'express';
import { getJournals, createJournal } from '../controllers/journals.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { masterDataSchema } from '../schemas/masterData.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validate(masterDataSchema.journal.list), getJournals);
router.post('/', requireRole('admin', 'accountant'), validate(masterDataSchema.journal.create), createJournal);

export default router;
