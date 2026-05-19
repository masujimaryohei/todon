import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(64).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const repeatFields = {
  repeatType: z.enum(['none', 'fixed', 'flexible']).optional(),
  repeatIntervalDays: z.number().int().min(1).max(365).optional().nullable(),
  flexibleMinDays: z.number().int().min(1).max(90).optional().nullable(),
  flexibleMaxDays: z.number().int().min(1).max(180).optional().nullable(),
};

function refineRepeatRules(
  data: {
    repeatType?: 'none' | 'fixed' | 'flexible';
    repeatIntervalDays?: number | null;
    flexibleMinDays?: number | null;
    flexibleMaxDays?: number | null;
  },
  ctx: z.RefinementCtx,
) {
  if (data.repeatType === 'fixed' && !data.repeatIntervalDays) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '固定リピートには間隔（日数）が必要です',
      path: ['repeatIntervalDays'],
    });
  }

  if (data.repeatType === 'flexible') {
    if (!data.flexibleMinDays || !data.flexibleMaxDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'だいたいリピートには最短・最長日数が必要です',
        path: ['flexibleMinDays'],
      });
    } else if (data.flexibleMaxDays < data.flexibleMinDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '最長日数は最短日数以上にしてください',
        path: ['flexibleMaxDays'],
      });
    }
  }
}

const taskBodySchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['todo', 'doing', 'done', 'pending', 'canceled']).optional(),
  dueType: z.enum(['none', 'datetime', 'anytime', 'flexible']).optional(),
  dueAt: z.string().optional().nullable(),
  importance: z.enum(['low', 'medium', 'high']).optional(),
  urgency: z.enum(['low', 'medium', 'high']).optional(),
  weight: z.enum(['light', 'normal', 'heavy']).optional(),
  categoryId: z.string().cuid().optional().nullable(),
  ...repeatFields,
});

export const createTaskSchema = taskBodySchema.superRefine(refineRepeatRules);

export const capacitySchema = z.object({
  level: z.enum(['relaxed', 'normal', 'busy', 'overload']),
});

export const updateTaskSchema = taskBodySchema
  .partial()
  .extend({
    title: z.string().min(1).max(256).optional(),
  })
  .superRefine(refineRepeatRules);

export const createCategorySchema = z.object({
  name: z.string().min(1).max(64),
  color: z.string().max(32).optional().nullable(),
});

export const createSubtaskSchema = z.object({
  title: z.string().min(1).max(256),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  completed: z.boolean().optional(),
  order: z.number().int().optional(),
});
