import { z } from 'zod';

const positiveDecimal = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'number' ? String(v) : v))
  .refine((s) => {
    const n = Number.parseFloat(s);
    return !Number.isNaN(n) && n > 0;
  }, 'Must be a positive number');

const optionalPositiveDecimal = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'number' ? String(v) : v))
  .refine((s) => {
    const n = Number.parseFloat(s);
    return !Number.isNaN(n) && n > 0;
  }, 'Must be a positive number')
  .optional()
  .nullable();

export const CreateProductSchema = z.object({
  name: z.string().min(2).max(200),
  genericName: z.string().min(2).max(200),
  category: z.enum(['TABLET', 'CAPSULE', 'INJECTION', 'SYRUP', 'DEVICE', 'OTHER']),
  description: z.string().optional(),
  mrp: positiveDecimal,
  ptr: positiveDecimal,
  pts: optionalPositiveDecimal,
  manufacturer: z.string().min(2).max(200),
  batchNumber: z.string().max(80).optional().nullable(),
  expiryDate: z.coerce.date().refine((d) => d > new Date(), 'Expiry must be in the future'),
  stockQty: z.coerce.number().int().min(0),
  isActive: z.boolean().optional().default(true),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
