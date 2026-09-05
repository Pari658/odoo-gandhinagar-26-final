import { z } from 'zod';
import { commonSchema } from './common.schema.js';

export const masterDataSchema = {
  account: {
    create: z.object({
      body: z.object({
        name: z.string().min(1, 'Name is required'),
        type: z.enum(['asset', 'liability', 'bank', 'cash', 'capital', 'income', 'expense', 'other_expense']),
        reportGroup: z.enum(['balance_sheet', 'profit_and_loss'])
      })
    }),
    update: z.object({
      params: commonSchema.uuidParam.shape.params,
      body: z.object({
        name: z.string().min(1).optional(),
        type: z.enum(['asset', 'liability', 'bank', 'cash', 'capital', 'income', 'expense', 'other_expense']).optional(),
        reportGroup: z.enum(['balance_sheet', 'profit_and_loss']).optional()
      })
    }),
    getById: commonSchema.uuidParam,
    list: commonSchema.paginationQuery
  },

  journal: {
    create: z.object({
      body: z.object({
        name: z.string().min(1, 'Name is required'),
        type: z.enum(['sales', 'purchase', 'bank', 'cash']),
        defaultDebitAccountId: z.string().uuid().optional().nullable(),
        defaultCreditAccountId: z.string().uuid().optional().nullable()
      })
    }),
    update: z.object({
      params: commonSchema.uuidParam.shape.params,
      body: z.object({
        name: z.string().min(1).optional(),
        type: z.enum(['sales', 'purchase', 'bank', 'cash']).optional(),
        defaultDebitAccountId: z.string().uuid().optional().nullable(),
        defaultCreditAccountId: z.string().uuid().optional().nullable()
      })
    }),
    getById: commonSchema.uuidParam,
    list: commonSchema.paginationQuery
  },

  taxRate: {
    create: z.object({
      body: z.object({
        name: z.string().min(1, 'Name is required'),
        ratePercent: z.number().min(0, 'Rate percent must be at least 0'),
        linkedAccountId: z.string().uuid().optional().nullable()
      })
    }),
    update: z.object({
      params: commonSchema.uuidParam.shape.params,
      body: z.object({
        name: z.string().min(1).optional(),
        ratePercent: z.number().min(0).optional(),
        linkedAccountId: z.string().uuid().optional().nullable()
      })
    }),
    getById: commonSchema.uuidParam,
    list: commonSchema.paginationQuery
  },

  analyticAccount: {
    create: z.object({
      body: z.object({
        name: z.string().min(1, 'Name is required'),
        type: z.enum(['income', 'expense'])
      })
    }),
    update: z.object({
      params: commonSchema.uuidParam.shape.params,
      body: z.object({
        name: z.string().min(1).optional(),
        type: z.enum(['income', 'expense']).optional()
      })
    }),
    getById: commonSchema.uuidParam,
    list: commonSchema.paginationQuery
  }
};
