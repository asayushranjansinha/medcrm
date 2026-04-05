import { z } from 'zod';

export const CreateDispatchSchema = z.object({
  productId: z.string().uuid(),
  personId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  dispatchType: z.enum(['SAMPLE', 'SALE', 'PROMOTIONAL', 'RETURN']),
  quantity: z.coerce.number().int().positive(),
  batchNumber: z.string().max(80).optional().nullable(),
  dispatchDate: z.coerce.date(),
  expectedDeliveryDate: z.coerce.date().optional().nullable(),
  actualDeliveryDate: z.coerce.date().optional().nullable(),
  status: z.enum(['PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED', 'CANCELLED']),
  invoiceNumber: z.string().max(80).optional().nullable(),
  totalValue: z
    .union([z.string(), z.number()])
    .transform((v) => (v === '' || v == null ? null : String(v)))
    .nullable()
    .optional(),
  address: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type CreateDispatchInput = z.infer<typeof CreateDispatchSchema>;

export const UpdateDispatchSchema = CreateDispatchSchema.partial();

export type UpdateDispatchInput = z.infer<typeof UpdateDispatchSchema>;
