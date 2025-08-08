import { Context } from 'hono';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export function errorResponse(c: Context, code: string, message: string, status: number) {
  return c.json<ErrorResponse>(
    {
      error: {
        code,
        message,
      },
    },
    status
  );
}

export function handleError(c: Context, error: unknown) {
  console.error('Error:', error);
  
  if (error instanceof Error) {
    if (error.message.includes('Unique constraint')) {
      return errorResponse(c, 'DUPLICATE_ENTRY', 'This record already exists', 409);
    }
    if (error.message.includes('Foreign key constraint')) {
      return errorResponse(c, 'INVALID_REFERENCE', 'Referenced record does not exist', 400);
    }
    if (error.message.includes('Record to update not found')) {
      return errorResponse(c, 'NOT_FOUND', 'Record not found', 404);
    }
  }
  
  return errorResponse(c, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
}