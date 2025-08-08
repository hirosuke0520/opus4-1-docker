import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createDealRoutes } from '../src/routes/deals';
import { createAuthRoutes } from '../src/routes/auth';
import { authMiddleware } from '../src/middleware/auth';

const prisma = new PrismaClient();
const app = new Hono();
app.route('/auth', createAuthRoutes(prisma));
app.use('/deals/*', authMiddleware);
app.route('/deals', createDealRoutes(prisma));

describe('Deals API - Stage Update Idempotency', () => {
  let authCookie: string;
  let testDealId: string;
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

    // Login
    const loginResponse = await request(app.fetch)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword',
      });
    
    authCookie = loginResponse.headers['set-cookie'][0];

    // Create test data
    const company = await prisma.company.create({
      data: { name: 'Test Company' },
    });

    const lead = await prisma.lead.create({
      data: {
        companyId: company.id,
        contactName: 'Test Lead',
        status: 'NEW',
        source: 'WEB',
      },
    });
    testLeadId = lead.id;

    const deal = await prisma.deal.create({
      data: {
        leadId: testLeadId,
        title: 'Test Deal',
        amount: 10000,
        stage: 'PROSPECTING',
      },
    });
    testDealId = deal.id;
  });

  afterAll(async () => {
    await prisma.deal.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' },
    });
    await prisma.$disconnect();
  });

  it('should update deal stage successfully', async () => {
    const response = await request(app.fetch)
      .patch(`/deals/${testDealId}`)
      .set('Cookie', authCookie)
      .send({ stage: 'PROPOSAL' });

    expect(response.status).toBe(200);
    expect(response.body.stage).toBe('PROPOSAL');
  });

  it('should be idempotent when updating to the same stage', async () => {
    // First update
    const response1 = await request(app.fetch)
      .patch(`/deals/${testDealId}`)
      .set('Cookie', authCookie)
      .send({ stage: 'NEGOTIATION' });

    expect(response1.status).toBe(200);
    expect(response1.body.stage).toBe('NEGOTIATION');

    // Second update with same stage (idempotent)
    const response2 = await request(app.fetch)
      .patch(`/deals/${testDealId}`)
      .set('Cookie', authCookie)
      .send({ stage: 'NEGOTIATION' });

    expect(response2.status).toBe(200);
    expect(response2.body.stage).toBe('NEGOTIATION');
    expect(response2.body.id).toBe(response1.body.id);
  });

  it('should handle multiple stage transitions correctly', async () => {
    const stages = ['PROSPECTING', 'PROPOSAL', 'NEGOTIATION', 'WON'];
    
    for (const stage of stages) {
      const response = await request(app.fetch)
        .patch(`/deals/${testDealId}`)
        .set('Cookie', authCookie)
        .send({ stage });

      expect(response.status).toBe(200);
      expect(response.body.stage).toBe(stage);
    }
  });
});