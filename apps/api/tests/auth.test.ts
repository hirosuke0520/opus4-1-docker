import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createAuthRoutes } from '../src/routes/auth';

const prisma = new PrismaClient();
const app = new Hono();
app.route('/auth', createAuthRoutes(prisma));

describe('Auth API', () => {
  beforeAll(async () => {
    // Create test user
    const passwordHash = await bcrypt.hash('testpassword', 10);
    await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        passwordHash,
        role: 'MEMBER',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' },
    });
    await prisma.$disconnect();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.fetch)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should fail with invalid password', async () => {
      const response = await request(app.fetch)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app.fetch)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app.fetch)
        .post('/auth/login')
        .send({
          email: 'invalidemail',
          password: 'testpassword',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app.fetch)
        .post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });
});