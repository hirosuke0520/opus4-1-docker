import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { errorResponse } from '../utils/errors';
import { validate } from '../middleware/validation';
import { csrfProtection } from '../middleware/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function createAuthRoutes(prisma: PrismaClient) {
  const auth = new Hono();

  auth.use('*', csrfProtection);

  auth.post('/login', validate(loginSchema), async (c) => {
    try {
      const { email, password } = c.get('validatedData') as z.infer<typeof loginSchema>;
      
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      if (!user) {
        return errorResponse(c, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }
      
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        return errorResponse(c, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }
      
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      
      setCookie(c, 'auth-token', token, {
        httpOnly: true,
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      
      return c.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      return errorResponse(c, 'LOGIN_FAILED', 'Login failed', 500);
    }
  });

  auth.post('/logout', async (c) => {
    deleteCookie(c, 'auth-token', {
      path: '/',
    });
    return c.json({ message: 'Logged out successfully' });
  });

  auth.get('/me', async (c) => {
    const token = c.req.header('Cookie')?.match(/auth-token=([^;]+)/)?.[1];
    
    if (!token) {
      return errorResponse(c, 'UNAUTHORIZED', 'Not authenticated', 401);
    }
    
    try {
      const { verifyToken } = await import('../utils/jwt');
      const payload = verifyToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });
      
      if (!user) {
        return errorResponse(c, 'USER_NOT_FOUND', 'User not found', 404);
      }
      
      return c.json({ user });
    } catch (error) {
      return errorResponse(c, 'INVALID_TOKEN', 'Invalid or expired token', 401);
    }
  });

  return auth;
}