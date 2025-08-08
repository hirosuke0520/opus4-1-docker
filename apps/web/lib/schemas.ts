import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  domain: z.string().optional(),
  notes: z.string().optional(),
});

export const leadSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  source: z.enum(['WEB', 'REFERRAL', 'EVENT', 'OTHER']),
  status: z.enum(['NEW', 'QUALIFIED', 'LOST']),
  score: z.number().int().min(0).max(100),
});

export const dealSchema = z.object({
  leadId: z.string().min(1, 'Lead is required'),
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be positive'),
  stage: z.enum(['PROSPECTING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']),
  expectedCloseDate: z.string().optional(),
});

export const activitySchema = z.object({
  leadId: z.string().min(1, 'Lead is required'),
  type: z.enum(['NOTE', 'TASK', 'CALL', 'EMAIL']),
  content: z.string().min(1, 'Content is required'),
  dueDate: z.string().optional(),
  completed: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type DealInput = z.infer<typeof dealSchema>;
export type ActivityInput = z.infer<typeof activitySchema>;