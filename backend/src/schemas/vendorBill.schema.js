import { z } from 'zod';
import { commonSchema } from './common.schema.js';

export const vendorBillSchema = {
  create: z.object({
    body: z.object({
      vendorId: z.string(),
      purchaseOrderId: z.string().optional().nullable(),
      invoiceDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
      dueDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
      billReference: z.string().optional().nullable(),
      lines: z.array(
        z.object({
          productId: z.string(),
          accountId: z.string(),
          analyticAccountId: z.string().optional().nullable(),
          quantity: z.number().min(1, 'Quantity must be at least 1'),
          unitPrice: z.number().min(0, 'Unit price must be positive')
        })
      ).min(1, 'At least one bill line is required')
    })
  })
};
