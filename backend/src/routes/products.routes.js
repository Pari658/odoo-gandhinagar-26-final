import { Router } from 'express';
import { 
  getProducts, 
  getProductCategories, 
  createProduct, 
  updateProduct 
} from '../controllers/products.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getProducts);
router.get('/categories', getProductCategories);
router.post('/', requireRole('admin', 'accountant'), createProduct);
router.put('/:id', requireRole('admin', 'accountant'), updateProduct);

export default router;
