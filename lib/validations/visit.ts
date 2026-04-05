import { z } from 'zod';

const sampleRow = z.object({
  productId: z.string().uuid(),
  qty: z.coerce.number().int().positive(),
});

export const CreateVisitSchema = z.object({
  personId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  visitDate: z.coerce.date(),
  purpose: z.enum(['DETAILING', 'SAMPLE_DROP', 'FOLLOW_UP', 'ORDER_COLLECTION', 'OTHER']),
  productsDiscussed: z.array(z.string().uuid()).optional().default([]),
  samplesGiven: z.array(sampleRow).optional().default([]),
  feedback: z.string().optional(),
  orderTaken: z.boolean().optional().default(false),
  orderValue: z
    .union([z.string(), z.number()])
    .transform((v) => (v === '' || v == null ? null : String(v)))
    .nullable()
    .optional(),
  nextVisitDate: z.coerce.date().optional().nullable(),
  status: z.enum(['PLANNED', 'COMPLETED', 'CANCELLED']),
});

export type CreateVisitInput = z.infer<typeof CreateVisitSchema>;

export const UpdateVisitSchema = CreateVisitSchema.partial();

export type UpdateVisitInput = z.infer<typeof UpdateVisitSchema>;
