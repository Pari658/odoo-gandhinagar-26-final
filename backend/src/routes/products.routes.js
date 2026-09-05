import { Router } from 'express';
import { 
  getProducts, 
  getProductCategories, 
  createProduct, 
  updateProduct 
} from '../controllers/products.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { productSchema } from '../schemas/product.schema.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validate(productSchema.list), getProducts);
router.get('/categories', getProductCategories);
router.post('/', requireRole('admin', 'accountant'), validate(productSchema.create), createProduct);
router.put('/:id', requireRole('admin', 'accountant'), validate(productSchema.update), updateProduct);

export default router;
