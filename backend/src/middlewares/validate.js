import { ZodError } from 'zod';

/**
 * Generic middleware to validate request payload against a Zod schema.
 * @param {import('zod').ZodSchema} schema
 */
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const formattedErrors = err.errors.map((e) => {
        const path = e.path.join('.');
        return `${path}: ${e.message}`;
      });

      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: formattedErrors
        }
      });
    }

    next(err);
  }
};
