import { z } from 'zod';

export const EntityTypeSchema = z.enum(['EMPLOYEE', 'STOCKIST', 'HOSPITAL', 'DOCTOR']);
export const SalesRoleSchema = z.enum(['NSM', 'ZSM', 'RSM', 'ASM', 'MR', 'ADMIN']);
export const EntityHospitalTypeSchema = z.enum([
  'GOVT_HOSPITAL',
  'PRIVATE_HOSPITAL',
  'NURSING_HOME',
  'CLINIC',
  'PHARMACY',
]);

export const CreatePersonSchema = z.object({
  entityType: EntityTypeSchema.optional().default('DOCTOR'),
  salesRole: SalesRoleSchema.optional().nullable(),
  reportingToId: z.string().uuid().optional().nullable(),
  zone: z.string().max(120).optional().nullable(),
  region: z.string().max(120).optional().nullable(),
  stockistCode: z.string().max(80).optional().nullable(),
  gstin: z.string().max(20).optional().nullable(),
  creditLimit: z.union([z.string(), z.number()]).optional().nullable(),
  outstandingAmount: z.union([z.string(), z.number()]).optional().nullable(),
  entityHospitalType: EntityHospitalTypeSchema.optional().nullable(),
  bedCount: z.coerce.number().int().optional().nullable(),
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
