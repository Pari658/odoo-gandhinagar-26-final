import { z } from 'zod';
import { commonSchema } from './common.schema.js';

const contactBody = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['customer', 'vendor', 'both']),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  mobile: z.string().max(20).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  pincode: z.string().max(10).optional().or(z.literal('')),
  profileImageUrl: z.string().url('Invalid URL').optional().or(z.literal(''))
});

export const contactSchema = {
  create: z.object({
    body: contactBody
  }),
  update: z.object({
    params: commonSchema.uuidParam.shape.params,
    body: contactBody.partial()
  }),
  getById: commonSchema.uuidParam,
  list: commonSchema.paginationQuery
};
