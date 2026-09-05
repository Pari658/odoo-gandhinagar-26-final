import { ZodError } from 'zod';

export const validate = (schema) => async (req, res, next) => {
  try {
    // Validate req directly against the schema if the schema targets req.body/query/params directly
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const validationDetails = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationDetails[0]?.message || 'Invalid input data',
          details: validationDetails,
        },
      });
    }

    next(error);
  }
};