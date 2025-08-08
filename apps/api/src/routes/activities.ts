import { Hono } from 'hono';
import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware, csrfProtection } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { errorResponse, handleError } from '../utils/errors';

const createActivitySchema = z.object({
  leadId: z.string().uuid(),
  type: z.enum(['NOTE', 'TASK', 'CALL', 'EMAIL']),
  content: z.string().min(1),
  dueDate: z.string().datetime().optional(),
  completed: z.boolean().default(false),
});

const updateActivitySchema = createActivitySchema.partial();

export function createActivityRoutes(prisma: PrismaClient) {
  const activities = new Hono();
  
  activities.use('*', authMiddleware);
  activities.use('*', csrfProtection);

  activities.get('/', async (c) => {
    try {
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('pageSize') || '20');
      const skip = (page - 1) * pageSize;
      
      const leadId = c.req.query('leadId');
      const completed = c.req.query('completed');
      const type = c.req.query('type');

      const where: Prisma.ActivityWhereInput = {};
      
      if (leadId) {
        where.leadId = leadId;
      }
      
      if (completed !== undefined) {
        where.completed = completed === 'true';
      }
      
      if (type) {
        where.type = type as any;
      }

      const [items, total] = await Promise.all([
        prisma.activity.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: [
            { completed: 'asc' },
            { dueDate: 'asc' },
            { createdAt: 'desc' },
          ],
          include: {
            lead: {
              include: {
                company: true,
              },
            },
          },
        }),
        prisma.activity.count({ where }),
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

  activities.get('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      
      const activity = await prisma.activity.findUnique({
        where: { id },
        include: {
          lead: {
            include: {
              company: true,
            },
          },
        },
      });

      if (!activity) {
        return errorResponse(c, 'NOT_FOUND', 'Activity not found', 404);
      }

      return c.json(activity);
    } catch (error) {
      return handleError(c, error);
    }
  });

  activities.post('/', validate(createActivitySchema), async (c) => {
    try {
      const data = c.get('validatedData') as z.infer<typeof createActivitySchema>;
      
      const activity = await prisma.activity.create({
        data: {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        },
        include: {
          lead: {
            include: {
              company: true,
            },
          },
        },
      });

      return c.json(activity, 201);
    } catch (error) {
      return handleError(c, error);
    }
  });

  activities.patch('/:id', validate(updateActivitySchema), async (c) => {
    try {
      const id = c.req.param('id');
      const data = c.get('validatedData') as z.infer<typeof updateActivitySchema>;
      
      const updateData: any = { ...data };
      if (data.dueDate) {
        updateData.dueDate = new Date(data.dueDate);
      }
      
      const activity = await prisma.activity.update({
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

      return c.json(activity);
    } catch (error) {
      return handleError(c, error);
    }
  });

  activities.delete('/:id', async (c) => {
    try {
      const id = c.req.param('id');
      
      await prisma.activity.delete({
        where: { id },
      });

      return c.json({ message: 'Activity deleted successfully' });
    } catch (error) {
      return handleError(c, error);
    }
  });

  return activities;
}