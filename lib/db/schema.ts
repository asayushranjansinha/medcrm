import { relations } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'MANAGER', 'MR']);
export const personDesignationEnum = pgEnum('person_designation', [
  'DOCTOR',
  'PHARMACIST',
  'NURSE',
  'HOSPITAL_ADMIN',
  'OTHER',
]);
export const hospitalTypeEnum = pgEnum('hospital_type', ['GOVT', 'PRIVATE', 'CLINIC']);
export const personEntityTypeEnum = pgEnum('person_entity_type', [
  'EMPLOYEE',
  'STOCKIST',
  'HOSPITAL',
  'DOCTOR',
]);
export const personSalesRoleEnum = pgEnum('person_sales_role', [
  'NSM',
  'ZSM',
  'RSM',
  'ASM',
  'MR',
  'ADMIN',
]);
export const entityHospitalTypeEnum = pgEnum('entity_hospital_type', [
  'GOVT_HOSPITAL',
  'PRIVATE_HOSPITAL',
  'NURSING_HOME',
  'CLINIC',
  'PHARMACY',
]);
export const dispatchMovementTypeEnum = pgEnum('dispatch_movement_type', [
  'COMPANY_TO_STOCKIST',
  'STOCKIST_TO_HOSPITAL',
  'STOCKIST_TO_RETAILER',
  'COMPANY_TO_HOSPITAL',
  'SAMPLE_TO_DOCTOR',
  'RETURN_FROM_STOCKIST',
  'RETURN_FROM_HOSPITAL',
  'ADJUSTMENT',
]);
export const personCategoryEnum = pgEnum('person_category', ['A', 'B', 'C']);
export const productCategoryEnum = pgEnum('product_category', [
  'TABLET',
  'CAPSULE',
  'INJECTION',
  'SYRUP',
  'DEVICE',
  'OTHER',
]);
export const visitPurposeEnum = pgEnum('visit_purpose', [
  'DETAILING',
  'SAMPLE_DROP',
  'FOLLOW_UP',
  'ORDER_COLLECTION',
  'OTHER',
]);
export const visitStatusEnum = pgEnum('visit_status', ['PLANNED', 'COMPLETED', 'CANCELLED']);
export const visitOutcomeEnum = pgEnum('visit_outcome', [
  'POSITIVE',
  'NEUTRAL',
  'NEGATIVE',
  'NOT_MET',
]);
export const visitTypeEnum = pgEnum('visit_type', [
  'DOCTOR_VISIT',
  'STOCKIST_VISIT',
  'HOSPITAL_VISIT',
  'OTHER',
]);
export const dispatchTypeEnum = pgEnum('dispatch_type', [
  'SAMPLE',
  'SALE',
  'PROMOTIONAL',
  'RETURN',
]);
export const dispatchStatusEnum = pgEnum('dispatch_status', [
  'PENDING',
  'DISPATCHED',
  'DELIVERED',
  'RETURNED',
  'CANCELLED',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id'),
  name: varchar('name', { length: 200 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('MR'),
  territory: varchar('territory', { length: 120 }),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
});

export const persons = pgTable(
  'persons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id'),
    entityType: personEntityTypeEnum('entity_type').notNull().default('DOCTOR'),
    salesRole: personSalesRoleEnum('role'),
    reportingToId: uuid('reporting_to_id').references((): AnyPgColumn => persons.id, {
      onDelete: 'set null',
    }),
    zone: varchar('zone', { length: 120 }),
    region: varchar('region', { length: 120 }),
    stockistCode: varchar('stockist_code', { length: 80 }),
    gstin: varchar('gstin', { length: 20 }),
    creditLimit: decimal('credit_limit', { precision: 14, scale: 2 }),
    outstandingAmount: decimal('outstanding_amount', { precision: 14, scale: 2 }),
    entityHospitalType: entityHospitalTypeEnum('entity_hospital_type'),
    bedCount: integer('bed_count'),
    name: varchar('name', { length: 200 }).notNull(),
    designation: personDesignationEnum('designation').notNull(),
    specialty: varchar('specialty', { length: 120 }),
    qualification: varchar('qualification', { length: 120 }),
    hospitalName: varchar('hospital_name', { length: 200 }).notNull(),
    hospitalType: hospitalTypeEnum('hospital_type').notNull(),
    address: text('address'),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    pincode: varchar('pincode', { length: 10 }),
    phone: varchar('phone', { length: 20 }).notNull(),
    email: varchar('email', { length: 255 }),
    category: personCategoryEnum('category').notNull(),
    territory: varchar('territory', { length: 120 }),
    assignedToUserId: uuid('assigned_to_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    lastVisitDate: timestamp('last_visit_date', { withTimezone: true, mode: 'date' }),
    totalVisits: integer('total_visits').notNull().default(0),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('persons_city_idx').on(t.city),
    index('persons_state_idx').on(t.state),
    index('persons_territory_idx').on(t.territory),
    index('persons_category_idx').on(t.category),
    index('persons_assigned_to_user_id_idx').on(t.assignedToUserId),
    index('persons_designation_idx').on(t.designation),
    index('persons_entity_type_idx').on(t.entityType),
    index('persons_reporting_to_id_idx').on(t.reportingToId),
  ]
);

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id'),
  name: varchar('name', { length: 200 }).notNull(),
  genericName: varchar('generic_name', { length: 200 }).notNull(),
  category: productCategoryEnum('category').notNull(),
  description: text('description'),
  mrp: decimal('mrp', { precision: 12, scale: 2 }).notNull(),
  ptr: decimal('ptr', { precision: 12, scale: 2 }).notNull(),
  pts: decimal('pts', { precision: 12, scale: 2 }),
  manufacturer: varchar('manufacturer', { length: 200 }).notNull(),
  batchNumber: varchar('batch_number', { length: 80 }),
  expiryDate: timestamp('expiry_date', { withTimezone: true, mode: 'date' }),
  stockQty: integer('stock_qty').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
});

export const visits = pgTable(
  'visits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id'),
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    visitDate: timestamp('visit_date', { withTimezone: true, mode: 'date' }).notNull(),
    purpose: visitPurposeEnum('purpose').notNull(),
    productsDiscussed: text('products_discussed').array(),
    samplesGiven: jsonb('samples_given').$type<{ productId: string; qty: number }[]>(),
    feedback: text('feedback'),
    orderTaken: boolean('order_taken').notNull().default(false),
    orderValue: decimal('order_value', { precision: 14, scale: 2 }),
    nextVisitDate: timestamp('next_visit_date', { withTimezone: true, mode: 'date' }),
    status: visitStatusEnum('status').notNull().default('PLANNED'),
    visitType: visitTypeEnum('visit_type').notNull().default('OTHER'),
    outcome: visitOutcomeEnum('outcome'),
    prescriptionCommitment: boolean('prescription_commitment').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('visits_person_id_idx').on(t.personId),
    index('visits_user_id_idx').on(t.userId),
    index('visits_visit_date_idx').on(t.visitDate),
    index('visits_status_idx').on(t.status),
  ]
);

export const dispatches = pgTable(
  'dispatches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id'),
    movementType: dispatchMovementTypeEnum('movement_type')
      .notNull()
      .default('COMPANY_TO_STOCKIST'),
    fromEntityId: uuid('from_entity_id').references(() => persons.id, {
      onDelete: 'set null',
    }),
    fromEntityType: varchar('from_entity_type', { length: 80 }),
    toEntityId: uuid('to_entity_id').references(() => persons.id, {
      onDelete: 'set null',
    }),
    toEntityType: varchar('to_entity_type', { length: 80 }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    dispatchType: dispatchTypeEnum('dispatch_type').notNull(),
    quantity: integer('quantity').notNull(),
    batchNumber: varchar('batch_number', { length: 80 }),
    dispatchDate: timestamp('dispatch_date', { withTimezone: true, mode: 'date' }).notNull(),
    expectedDeliveryDate: timestamp('expected_delivery_date', {
      withTimezone: true,
      mode: 'date',
    }),
    actualDeliveryDate: timestamp('actual_delivery_date', {
      withTimezone: true,
      mode: 'date',
    }),
    status: dispatchStatusEnum('status').notNull().default('PENDING'),
    invoiceNumber: varchar('invoice_number', { length: 80 }),
    totalValue: decimal('total_value', { precision: 14, scale: 2 }),
    address: text('address'),
    remarks: text('remarks'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('dispatches_product_id_idx').on(t.productId),
    index('dispatches_person_id_idx').on(t.personId),
    index('dispatches_user_id_idx').on(t.userId),
    index('dispatches_dispatch_date_idx').on(t.dispatchDate),
    index('dispatches_status_idx').on(t.status),
    index('dispatches_movement_type_idx').on(t.movementType),
    index('dispatches_from_entity_id_idx').on(t.fromEntityId),
    index('dispatches_to_entity_id_idx').on(t.toEntityId),
  ]
);

export const stockistInventory = pgTable(
  'stockist_inventory',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    currentQty: integer('current_qty').notNull().default(0),
    lastMovementDate: date('last_movement_date', { mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('stockist_inventory_person_product_unique').on(t.personId, t.productId),
    index('stockist_inventory_person_id_idx').on(t.personId),
    index('stockist_inventory_product_id_idx').on(t.productId),
  ]
);

export const hospitalInventory = pgTable(
  'hospital_inventory',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    currentQty: integer('current_qty').notNull().default(0),
    lastMovementDate: date('last_movement_date', { mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('hospital_inventory_person_product_unique').on(t.personId, t.productId),
    index('hospital_inventory_person_id_idx').on(t.personId),
    index('hospital_inventory_product_id_idx').on(t.productId),
  ]
);

export const monthlyTargets = pgTable(
  'monthly_targets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    targetValue: decimal('target_value', { precision: 14, scale: 2 }).notNull().default('0'),
    achievedValue: decimal('achieved_value', { precision: 14, scale: 2 }).notNull().default('0'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('monthly_targets_employee_product_month_year_unique').on(
      t.employeeId,
      t.productId,
      t.month,
      t.year
    ),
    index('monthly_targets_employee_id_idx').on(t.employeeId),
    index('monthly_targets_month_year_idx').on(t.month, t.year),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  assignedPersons: many(persons),
  visits: many(visits),
  dispatches: many(dispatches),
}));

export const personsRelations = relations(persons, ({ one, many }) => ({
  assignedTo: one(users, {
    fields: [persons.assignedToUserId],
    references: [users.id],
  }),
  reportingTo: one(persons, {
    fields: [persons.reportingToId],
    references: [persons.id],
    relationName: 'person_reporting_chain',
  }),
  directReports: many(persons, {
    relationName: 'person_reporting_chain',
  }),
  visits: many(visits),
  dispatchesAsRecipient: many(dispatches, { relationName: 'dispatch_recipient_person' }),
  dispatchesFromAsParty: many(dispatches, { relationName: 'dispatch_from_entity_person' }),
  dispatchesToAsParty: many(dispatches, { relationName: 'dispatch_to_entity_person' }),
  stockistInventoryRows: many(stockistInventory),
  hospitalInventoryRows: many(hospitalInventory),
  monthlyTargets: many(monthlyTargets),
}));

export const productsRelations = relations(products, ({ many }) => ({
  dispatches: many(dispatches),
  stockistInventoryRows: many(stockistInventory),
  hospitalInventoryRows: many(hospitalInventory),
  monthlyTargets: many(monthlyTargets),
}));

export const visitsRelations = relations(visits, ({ one }) => ({
  person: one(persons, {
    fields: [visits.personId],
    references: [persons.id],
  }),
  user: one(users, {
    fields: [visits.userId],
    references: [users.id],
  }),
}));

export const dispatchesRelations = relations(dispatches, ({ one }) => ({
  product: one(products, {
    fields: [dispatches.productId],
    references: [products.id],
  }),
  person: one(persons, {
    fields: [dispatches.personId],
    references: [persons.id],
    relationName: 'dispatch_recipient_person',
  }),
  user: one(users, {
    fields: [dispatches.userId],
    references: [users.id],
  }),
  fromEntityPerson: one(persons, {
    fields: [dispatches.fromEntityId],
    references: [persons.id],
    relationName: 'dispatch_from_entity_person',
  }),
  toEntityPerson: one(persons, {
    fields: [dispatches.toEntityId],
    references: [persons.id],
    relationName: 'dispatch_to_entity_person',
  }),
}));

export const stockistInventoryRelations = relations(stockistInventory, ({ one }) => ({
  person: one(persons, {
    fields: [stockistInventory.personId],
    references: [persons.id],
  }),
  product: one(products, {
    fields: [stockistInventory.productId],
    references: [products.id],
  }),
}));

export const hospitalInventoryRelations = relations(hospitalInventory, ({ one }) => ({
  person: one(persons, {
    fields: [hospitalInventory.personId],
    references: [persons.id],
  }),
  product: one(products, {
    fields: [hospitalInventory.productId],
    references: [products.id],
  }),
}));

export const monthlyTargetsRelations = relations(monthlyTargets, ({ one }) => ({
  employee: one(persons, {
    fields: [monthlyTargets.employeeId],
    references: [persons.id],
  }),
  product: one(products, {
    fields: [monthlyTargets.productId],
    references: [products.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Person = typeof persons.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Visit = typeof visits.$inferSelect;
export type Dispatch = typeof dispatches.$inferSelect;
export type StockistInventoryRow = typeof stockistInventory.$inferSelect;
export type HospitalInventoryRow = typeof hospitalInventory.$inferSelect;
export type MonthlyTargetRow = typeof monthlyTargets.$inferSelect;
