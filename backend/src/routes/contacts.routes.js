import { Router } from 'express';
import { 
  getContacts, 
  getContactById, 
  createContact, 
  updateContact, 
  archiveContact 
} from '../controllers/contacts.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { contactSchema } from '../schemas/contact.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validate(contactSchema.list), getContacts);
router.get('/:id', validate(contactSchema.getById), getContactById);
router.post('/', requireRole('admin', 'accountant'), validate(contactSchema.create), createContact);
router.put('/:id', requireRole('admin', 'accountant'), validate(contactSchema.update), updateContact);
router.patch('/:id/archive', requireRole('admin'), validate(contactSchema.getById), archiveContact);

export default router;
