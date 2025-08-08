import { Context, Next } from 'hono';
import { z } from 'zod';
import { errorResponse } from '../utils/errors';

export function validate(schema: z.ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      c.set('validatedData', validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return errorResponse(c, 'VALIDATION_ERROR', message, 400);
      }
      return errorResponse(c, 'INVALID_REQUEST', 'Invalid request body', 400);
    }
  };
}