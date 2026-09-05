import { z } from 'zod';

export const paymentSchema = {
  create: z.object({
    body: z.object({
      direction: z.enum(['inbound', 'outbound']),
      vendorBillId: z.string().optional().nullable(),
      customerInvoiceId: z.string().optional().nullable(),
      partnerId: z.string(),
      amount: z.number().min(0.01, 'Amount must be greater than 0'),
      method: z.enum(['cash', 'bank']),
      paymentDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
      note: z.string().optional().nullable()
    }).refine(data => data.vendorBillId || data.customerInvoiceId, {
      message: 'Either vendorBillId or customerInvoiceId must be provided'
    })
  })
};
