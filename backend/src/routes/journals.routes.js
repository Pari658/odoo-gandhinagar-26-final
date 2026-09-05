import { Router } from 'express';
import { getJournals, createJournal, updateJournal, deleteJournal } from '../controllers/journals.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getJournals);
router.post('/', requireRole('admin', 'accountant'), createJournal);
router.put('/:id', requireRole('admin', 'accountant'), updateJournal);
router.delete('/:id', requireRole('admin', 'accountant'), deleteJournal);

export default router;
