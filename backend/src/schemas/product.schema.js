import { z } from 'zod';
import { commonSchema } from './common.schema.js';

const productBody = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['goods', 'service', 'combo']),
  salesPrice: z.number().min(0, 'Sales price must be at least 0'),
  costPrice: z.number().min(0, 'Cost price must be at least 0'),
  category: z.string().max(100).optional().or(z.literal('')),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal(''))
});

export const productSchema = {
  create: z.object({
    body: productBody
  }),
  update: z.object({
    params: commonSchema.uuidParam.shape.params,
    body: productBody.partial()
  }),
  getById: commonSchema.uuidParam,
  list: commonSchema.paginationQuery
};
