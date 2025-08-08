import { Hono } from 'hono';
import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware, csrfProtection } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { errorResponse, handleError } from '../utils/errors';

const createDealSchema = z.object({
  leadId: z.string().uuid(),
  title: z.string().min(1).max(255),
  amount: z.number().positive(),
  stage: z.enum(['PROSPECTING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).default('PROSPECTING'),
  expectedCloseDate: z.string().datetime().optional(),
});

const updateDealSchema = createDealSchema.partial();

export function createDealRoutes(prisma: PrismaClient) {
  const deals = new Hono();
  
  deals.use('*', authMiddleware);
  deals.use('*', csrfProtection);

  deals.get('/', async (c) => {
    try {
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '50');
      const skip = (page - 1) * pageSize;
      const stage = c.req.query('stage');
      const leadId = c.req.query('leadId');

      const where: Prisma.DealWhereInput = {};
      
      if (stage) {
        where.stage = stage as any;
      }
      
      if (leadId) {
        where.leadId = leadId;
      }

      const [items, total] = await Promise.all([
        prisma.deal.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            lead: {
              include: {
                company: true,
              },
            },
          },
        }),
        prisma.deal.count({ where }),
      ]);

      // Group by stage for kanban view
      const stages = ['PROSPECTING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
      const dealsByStage = stages.reduce((acc, stageKey) => {
        acc[stageKey] = items.filter(deal => deal.stage === stageKey);
        return acc;
      }, {} as Record<string, typeof items>);

      return c.json({
        items,
        dealsByStage,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      return handleError(c, error);
    }
  });

  deals.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      
      const deal = await prisma.deal.findUnique({
        where: { id },
        include: {
          lead: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!deal) {
        return errorResponse(c, 'NOT_FOUND', 'Deal not found', 404);
      }

      return c.json(deal);
    } catch (error) {
      return handleError(c, error);
    }
  });

  deals.post('/', validate(createDealSchema), async (c) => {
    try {
      const data = c.get('validatedData') as z.infer<typeof createDealSchema>;
      
      const deal = await prisma.deal.create({
        data: {
          ...data,
          expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        },
        include: {
          lead: {
            include: {
              company: true,
            },
          },
        },
      });

      return c.json(deal, 201);
    } catch (error) {
      return handleError(c, error);
    }
  });

  deals.patch('/:id', validate(updateDealSchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = c.get('validatedData') as z.infer<typeof updateDealSchema>;
      
      const updateData: any = { ...data };
      if (data.expectedCloseDate) {
        updateData.expectedCloseDate = new Date(data.expectedCloseDate);
      }
      
      const deal = await prisma.deal.update({
        where: { id },
        data: updateData,
        include: {
          lead: {
            include: {
              company: true,
            },
          },
        },
      });

      return c.json(deal);
    } catch (error) {
      return handleError(c, error);
    }
  });

  deals.delete('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      
      await prisma.deal.delete({
        where: { id },
      });

      return c.json({ message: 'Deal deleted successfully' });
    } catch (error) {
      return handleError(c, error);
    }
  });

  return deals;
}