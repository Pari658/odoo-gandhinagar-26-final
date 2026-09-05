import { z } from 'zod';

export const commonSchema = {
  uuidParam: z.object({
    params: z.object({
      id: z.string().uuid('Invalid UUID format')
    })
  }),
  paginationQuery: z.object({
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
      search: z.string().optional()
    })
  })
};
