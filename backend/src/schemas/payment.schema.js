import { z } from 'zod';

const uuid = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  'Must be a valid UUID'
);
const paymentDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Payment date must be YYYY-MM-DD');

export const paymentSchema = {
  create: z.object({
    body: z.object({
      direction: z.enum(['inbound', 'outbound']),
      vendorBillId: uuid.nullable(),
      customerInvoiceId: uuid.nullable(),
      partnerId: uuid.optional().nullable(),
      amount: z.number()
        .finite()
        .positive('Amount must be greater than 0')
        .refine(value => /^\d+(\.\d{1,2})?$/.test(String(value)), 'Amount must have at most 2 decimal places'),
      method: z.enum(['cash', 'bank']),
      paymentDate,
      note: z.string().optional().nullable()
    }).refine(data => Boolean(data.vendorBillId) !== Boolean(data.customerInvoiceId), {
      message: 'Exactly one of vendorBillId or customerInvoiceId must be provided'
    })
  }),
  id: z.object({
    params: z.object({ id: uuid })
  }),
  list: z.object({
    query: z.object({
      direction: z.enum(['inbound', 'outbound']).optional(),
      status: z.enum(['draft', 'confirmed', 'cancelled']).optional(),
      vendorBillId: uuid.optional(),
      customerInvoiceId: uuid.optional(),
      page: z.string().regex(/^\d+$/, 'Page must be a positive integer').refine(value => Number(value) > 0, 'Page must be a positive integer').optional().default('1')
    })
  })
};
