import { Router } from 'express';
import { 
  getContacts, 
  getContactById, 
  createContact, 
  updateContact, 
  archiveContact 
} from '../controllers/contacts.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getContacts);
router.get('/:id', getContactById);
router.post('/', requireRole('admin', 'accountant'), createContact);
router.put('/:id', requireRole('admin', 'accountant'), updateContact);
router.patch('/:id/archive', requireRole('admin'), archiveContact);

export default router;
