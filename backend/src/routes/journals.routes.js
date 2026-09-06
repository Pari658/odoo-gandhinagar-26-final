import { Router } from 'express';
import { getJournals, getJournalById, createJournal, updateJournal, deleteJournal } from '../controllers/journals.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { masterDataSchema } from '../schemas/masterData.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validate(masterDataSchema.journal.list), getJournals);
router.get('/:id', validate(masterDataSchema.journal.getById), getJournalById);
router.post('/', requireRole('admin', 'accountant'), validate(masterDataSchema.journal.create), createJournal);
router.put('/:id', requireRole('admin', 'accountant'), validate(masterDataSchema.journal.update), updateJournal);
router.delete('/:id', requireRole('admin', 'accountant'), validate(masterDataSchema.journal.getById), deleteJournal);

export default router;
