import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
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
  visits: many(visits),
  dispatches: many(dispatches),
}));

export const productsRelations = relations(products, ({ many }) => ({
  dispatches: many(dispatches),
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
  }),
  user: one(users, {
    fields: [dispatches.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Person = typeof persons.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Visit = typeof visits.$inferSelect;
export type Dispatch = typeof dispatches.$inferSelect;
