import { Hono } from 'hono';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, csrfProtection } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { errorResponse, handleError } from '../utils/errors';

const createCompanySchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().optional(),
  notes: z.string().optional(),
});

const updateCompanySchema = createCompanySchema.partial();

export function createCompanyRoutes(prisma: PrismaClient) {
  const companies = new Hono();
  
  companies.use('*', authMiddleware);
  companies.use('*', csrfProtection);

  companies.get('/', async (c) => {
    try {
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '20');
      const skip = (page - 1) * pageSize;

      const [items, total] = await Promise.all([
        prisma.company.findMany({
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { leads: true },
            },
          },
        }),
        prisma.company.count(),
      ]);

      return c.json({
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      return handleError(c, error);
    }
  });

  companies.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      
      const company = await prisma.company.findUnique({
        where: { id },
        include: {
          _count: {
            select: { leads: true },
          },
        },
      });

      if (!company) {
        return errorResponse(c, 'NOT_FOUND', 'Company not found', 404);
      }

      return c.json(company);
    } catch (error) {
      return handleError(c, error);
    }
  });

  companies.post('/', validate(createCompanySchema), async (c) => {
    try {
      const data = c.get('validatedData') as z.infer<typeof createCompanySchema>;
      
      const company = await prisma.company.create({
        data,
      });

      return c.json(company, 201);
    } catch (error) {
      return handleError(c, error);
    }
  });

  companies.patch('/:id', validate(updateCompanySchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = c.get('validatedData') as z.infer<typeof updateCompanySchema>;
      
      const company = await prisma.company.update({
        where: { id },
        data,
      });

      return c.json(company);
    } catch (error) {
      return handleError(c, error);
    }
  });

  companies.delete('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      
      await prisma.company.delete({
        where: { id },
      });

      return c.json({ message: 'Company deleted successfully' });
    } catch (error) {
      return handleError(c, error);
    }
  });

  return companies;
}