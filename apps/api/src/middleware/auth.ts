import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken } from '../utils/jwt';
import { errorResponse } from '../utils/errors';

export async function authMiddleware(c: Context, next: Next) {
  try {
    const token = getCookie(c, 'auth-token');
    
    if (!token) {
      return errorResponse(c, 'UNAUTHORIZED', 'Authentication required', 401);
    }
    
    const payload = verifyToken(token);
    c.set('user', payload);
    
    await next();
  } catch (error) {
    return errorResponse(c, 'INVALID_TOKEN', 'Invalid or expired token', 401);
  }
}

export async function csrfProtection(c: Context, next: Next) {
  const method = c.req.method;
  
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = c.req.header('origin');
    const host = c.req.header('host');
    
    if (origin && host) {
      const expectedOrigins = [
        `http://${host}`,
        `https://${host}`,
        'http://localhost:3000',
        'http://localhost:8787'
      ];
      
      if (!expectedOrigins.some(expected => origin.startsWith(expected))) {
        return errorResponse(c, 'FORBIDDEN', 'Cross-origin request blocked', 403);
      }
    }
  }
  
  await next();
}