import { Router } from 'express';
import { getJournals, createJournal } from '../controllers/journals.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getJournals);
router.post('/', requireRole('admin', 'accountant'), createJournal);

export default router;
