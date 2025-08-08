import { Hono } from 'hono';
import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware, csrfProtection } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { errorResponse, handleError } from '../utils/errors';

const createLeadSchema = z.object({
  companyId: z.string().uuid(),
  contactName: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.enum(['WEB', 'REFERRAL', 'EVENT', 'OTHER']),
  status: z.enum(['NEW', 'QUALIFIED', 'LOST']).default('NEW'),
  score: z.number().int().min(0).max(100).default(0),
});

const updateLeadSchema = createLeadSchema.partial();

export function createLeadRoutes(prisma: PrismaClient) {
  const leads = new Hono();
  
  leads.use('*', authMiddleware);
  leads.use('*', csrfProtection);

  leads.get('/', async (c) => {
    try {
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '20');
      const skip = (page - 1) * pageSize;
      
      const q = c.req.query('q');
      const status = c.req.query('status');
      const companyId = c.req.query('companyId');

      const where: Prisma.LeadWhereInput = {};
      
      if (q) {
        where.OR = [
          { contactName: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ];
      }
      
      if (status) {
        where.status = status as any;
      }
      
      if (companyId) {
        where.companyId = companyId;
      }

      const [items, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            company: true,
            _count: {
              select: {
                deals: true,
                activities: true,
              },
            },
          },
        }),
        prisma.lead.count({ where }),
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

  leads.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      
      const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
          company: true,
          deals: {
            orderBy: { createdAt: 'desc' },
          },
          activities: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!lead) {
        return errorResponse(c, 'NOT_FOUND', 'Lead not found', 404);
      }

      return c.json(lead);
    } catch (error) {
      return handleError(c, error);
    }
  });

  leads.post('/', validate(createLeadSchema), async (c) => {
    try {
      const data = c.get('validatedData') as z.infer<typeof createLeadSchema>;
      
      const lead = await prisma.lead.create({
        data,
        include: {
          company: true,
        },
      });

      return c.json(lead, 201);
    } catch (error) {
      return handleError(c, error);
    }
  });

  leads.patch('/:id', validate(updateLeadSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = c.get('validatedData') as z.infer<typeof updateLeadSchema>;
      
      const lead = await prisma.lead.update({
        where: { id },
        data,
        include: {
          company: true,
        },
      });

      return c.json(lead);
    } catch (error) {
      return handleError(c, error);
    }
  });

  leads.delete('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      
      await prisma.lead.delete({
        where: { id },
      });

      return c.json({ message: 'Lead deleted successfully' });
    } catch (error) {
      return handleError(c, error);
    }
  });

  return leads;
}