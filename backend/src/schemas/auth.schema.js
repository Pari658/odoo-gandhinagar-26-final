import { z } from 'zod';

export const authSchema = {
  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email address').optional(),
      password: z.string().min(1, 'Password is required')
    }).refine(data => data.email || data.username, {
      message: 'Either email, or username is required',
    })
  }),

  signup: z.object({
    body: z.object({
      name: z.string().min(1, 'Name is required').optional(),
      loginId: z.string().min(6, 'Login Id must be at least 6 characters').max(12, 'Login Id must be at most 12 characters'),
      email: z.string().email('A valid Email Id is required'),
      password: z.string()
        .min(9, 'Password length should be more than 8 characters')
        .regex(/[a-z]/, 'Password must contain a lowercase letter')
        .regex(/[A-Z]/, 'Password must contain an uppercase letter')
        .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
      confirmPassword: z.string().optional(),
      role: z.enum(['customer', 'vendor', 'both']).optional().default('customer')
    }).refine(data => !data.confirmPassword || data.password === data.confirmPassword, {
      message: 'Passwords do not match',
    })
  }),

  refresh: z.object({
    body: z.object({
      refreshToken: z.string().min(1, 'Refresh token is required')
    })
  })
};
