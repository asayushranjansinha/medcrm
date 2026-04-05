import { z } from 'zod';

export const CreatePersonSchema = z.object({
  name: z.string().min(2).max(100),
  designation: z.enum(['DOCTOR', 'PHARMACIST', 'NURSE', 'HOSPITAL_ADMIN', 'OTHER']),
  specialty: z.string().optional(),
  qualification: z.string().optional(),
  hospitalName: z.string().min(2).max(150),
  hospitalType: z.enum(['GOVT', 'PRIVATE', 'CLINIC']),
  address: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Invalid pincode')
    .optional()
    .or(z.literal('')),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  category: z.enum(['A', 'B', 'C']),
  territory: z.string().optional(),
  assignedToUserId: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional(),
});

export type CreatePersonInput = z.infer<typeof CreatePersonSchema>;

export const UpdatePersonSchema = CreatePersonSchema.partial();

export type UpdatePersonInput = z.infer<typeof UpdatePersonSchema>;
