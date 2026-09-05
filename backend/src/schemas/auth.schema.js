import { z } from 'zod';

export const authSchema = {
  login: z.object({
    body: z.object({
      loginId: z.string().optional(),
      email: z.string().optional(),
      username: z.string().optional(),
      password: z.string().min(1, 'Password is required')
    }).refine(data => data.loginId || data.email || data.username, {
      message: 'Login ID or Email is required',
    })
  }),

  signup: z.object({
    body: z.object({
      name: z.string().optional(),
      loginId: z.string().min(6, 'Login Id must be at least 6 characters').max(12, 'Login Id must be at most 12 characters'),
      email: z.string().email('A valid Email Id is required'),
      password: z.string().min(9, 'Password length should be more than 8 characters'),
      confirmPassword: z.string().optional(),
      role: z.enum(['customer', 'vendor', 'both']).optional().default('customer')
    })
  }),

  refresh: z.object({
    body: z.object({
      refreshToken: z.string().min(1, 'Refresh token is required')
    })
  })
};
