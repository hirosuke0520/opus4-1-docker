import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createLeadRoutes } from '../src/routes/leads';
import { createAuthRoutes } from '../src/routes/auth';
import { authMiddleware } from '../src/middleware/auth';

const prisma = new PrismaClient();
const app = new Hono();
app.route('/auth', createAuthRoutes(prisma));
app.use('/leads/*', authMiddleware);
app.route('/leads', createLeadRoutes(prisma));

describe('Leads API', () => {
  let authCookie: string;
  let testCompanyId: string;
  let testLeadId: string;

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

    // Login to get auth cookie
    const loginResponse = await request(app.fetch)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword',
      });
    
    authCookie = loginResponse.headers['set-cookie'][0];

    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Test Company',
        domain: 'test.com',
      },
    });
    testCompanyId = company.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.lead.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' },
    });
    await prisma.$disconnect();
  });

  describe('GET /leads', () => {
    beforeEach(async () => {
      // Create test leads
      await prisma.lead.createMany({
        data: [
          {
            companyId: testCompanyId,
            contactName: 'John Doe',
            email: 'john@example.com',
            phone: '123-456-7890',
            source: 'WEB',
            status: 'NEW',
            score: 75,
          },
          {
            companyId: testCompanyId,
            contactName: 'Jane Smith',
            email: 'jane@example.com',
            source: 'REFERRAL',
            status: 'QUALIFIED',
            score: 90,
          },
        ],
      });
    });

    it('should return leads with pagination', async () => {
      const response = await request(app.fetch)
        .get('/leads?page=1&pageSize=10')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should search leads by query', async () => {
      const response = await request(app.fetch)
        .get('/leads?q=john')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items[0].contactName.toLowerCase()).toContain('john');
    });

    it('should filter leads by status', async () => {
      const response = await request(app.fetch)
        .get('/leads?status=QUALIFIED')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items.every((lead: any) => lead.status === 'QUALIFIED')).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app.fetch)
        .get('/leads');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /leads', () => {
    it('should create a new lead', async () => {
      const response = await request(app.fetch)
        .post('/leads')
        .set('Cookie', authCookie)
        .send({
          companyId: testCompanyId,
          contactName: 'New Lead',
          email: 'newlead@example.com',
          source: 'WEB',
          status: 'NEW',
          score: 50,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.contactName).toBe('New Lead');
      
      testLeadId = response.body.id;
    });
  });
});