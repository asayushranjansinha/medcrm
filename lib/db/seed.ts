import './load-env';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { db } from './index';
import {
  dispatches,
  hospitalInventory,
  monthlyTargets,
  persons,
  products,
  stockistInventory,
  users,
  visits,
} from './schema';

if (
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('medcrm_placeholder')
) {
  console.error('Set a real DATABASE_URL in .env.local before seeding.');
  process.exit(1);
}

const designations = [
  'DOCTOR',
  'PHARMACIST',
  'NURSE',
  'HOSPITAL_ADMIN',
  'OTHER',
] as const;
const hospitalTypes = ['GOVT', 'PRIVATE', 'CLINIC'] as const;
const categories = ['A', 'B', 'C'] as const;
const productCats = ['TABLET', 'CAPSULE', 'INJECTION', 'SYRUP', 'DEVICE', 'OTHER'] as const;
const visitPurposes = [
  'DETAILING',
  'SAMPLE_DROP',
  'FOLLOW_UP',
  'ORDER_COLLECTION',
  'OTHER',
] as const;
const visitStatuses = ['PLANNED', 'COMPLETED', 'CANCELLED'] as const;
const dispatchTypes = ['SAMPLE', 'SALE', 'PROMOTIONAL', 'RETURN'] as const;
const dispatchStatuses = [
  'PENDING',
  'DISPATCHED',
  'DELIVERED',
  'RETURNED',
  'CANCELLED',
] as const;
const entityHospitalTypes = [
  'GOVT_HOSPITAL',
  'PRIVATE_HOSPITAL',
  'NURSING_HOME',
  'CLINIC',
  'PHARMACY',
] as const;

type Movement =
  | 'COMPANY_TO_STOCKIST'
  | 'STOCKIST_TO_HOSPITAL'
  | 'STOCKIST_TO_RETAILER'
  | 'COMPANY_TO_HOSPITAL'
  | 'SAMPLE_TO_DOCTOR'
  | 'RETURN_FROM_STOCKIST'
  | 'RETURN_FROM_HOSPITAL'
  | 'ADJUSTMENT';

function bump(
  map: Map<string, Map<string, number>>,
  personId: string,
  productId: string,
  delta: number
) {
  if (!map.has(personId)) map.set(personId, new Map());
  const m = map.get(personId)!;
  m.set(productId, (m.get(productId) ?? 0) + delta);
}

async function main() {
  faker.seed(42_001);
  console.log('Truncating tables…');
  await db.execute(
    sql`TRUNCATE TABLE dispatches, visits, stockist_inventory, hospital_inventory, monthly_targets, persons, products, users RESTART IDENTITY CASCADE`
  );

  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const managerHash = bcrypt.hashSync('Manager@123', 10);
  const mrHash = bcrypt.hashSync('Mr@123', 10);

  const [admin, manager, mr] = await db
    .insert(users)
    .values([
      {
        name: 'System Admin',
        email: 'admin@medcrm.com',
        password: adminHash,
        role: 'ADMIN',
        territory: 'All India',
        phone: '9876543210',
      },
      {
        name: 'Priya Sharma',
        email: 'manager@medcrm.com',
        password: managerHash,
        role: 'MANAGER',
        territory: 'Mumbai',
        phone: '9876543211',
      },
      {
        name: 'Rahul Verma',
        email: 'mr@medcrm.com',
        password: mrHash,
        role: 'MR',
        territory: 'Mumbai',
        phone: '9876543212',
      },
    ])
    .returning();

  const basePerson = {
    hospitalName: 'Corporate HQ',
    hospitalType: 'PRIVATE' as const,
    address: 'HQ Tower',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '9876500000',
    category: 'A' as const,
    territory: 'Mumbai',
    isActive: true,
    designation: 'OTHER' as const,
  };

  const [nsm] = await db
    .insert(persons)
    .values({
      ...basePerson,
      name: 'Asha Mehta',
      email: 'asha.nsm@corp.com',
      entityType: 'EMPLOYEE',
      salesRole: 'NSM',
      reportingToId: null,
      assignedToUserId: null,
    })
    .returning();

  const [rsm] = await db
    .insert(persons)
    .values({
      ...basePerson,
      name: 'Vikram Singh',
      email: 'vikram.rsm@corp.com',
      entityType: 'EMPLOYEE',
      salesRole: 'RSM',
      reportingToId: nsm!.id,
      assignedToUserId: null,
    })
    .returning();

  const mrEmployees = await db
    .insert(persons)
    .values([
      {
        ...basePerson,
        name: 'Rahul Verma (MR)',
        email: 'rahul.mr@corp.com',
        entityType: 'EMPLOYEE',
        salesRole: 'MR',
        reportingToId: rsm!.id,
        assignedToUserId: mr!.id,
      },
      {
        ...basePerson,
        name: 'Neha Kapoor',
        email: 'neha.mr@corp.com',
        entityType: 'EMPLOYEE',
        salesRole: 'MR',
        reportingToId: rsm!.id,
        assignedToUserId: manager!.id,
      },
      {
        ...basePerson,
        name: 'Sanjay Patil',
        email: 'sanjay.mr@corp.com',
        entityType: 'EMPLOYEE',
        salesRole: 'MR',
        reportingToId: rsm!.id,
        assignedToUserId: admin!.id,
      },
    ])
    .returning();

  const stockistRows = await db
    .insert(persons)
    .values(
      Array.from({ length: 5 }, (_, i) => ({
        name: `Stockist Partner ${i + 1}`,
        designation: 'OTHER' as const,
        specialty: null,
        qualification: null,
        hospitalName: `Distribution Point ${i + 1}`,
        hospitalType: 'PRIVATE' as const,
        address: faker.location.streetAddress(),
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        phone: `987651000${i}`,
        email: `stockist${i + 1}@example.com`,
        category: 'B' as const,
        territory: 'Mumbai',
        entityType: 'STOCKIST' as const,
        salesRole: null,
        reportingToId: null,
        assignedToUserId: [mr!.id, mr!.id, manager!.id, mr!.id, admin!.id][i]!,
        stockistCode: `STK-${100 + i}`,
        gstin: `27AAAAA0000A1Z${i}`,
        zone: 'West',
        region: 'MH-1',
        isActive: true,
      }))
    )
    .returning();

  const hospitalRows = await db
    .insert(persons)
    .values(
      Array.from({ length: 5 }, (_, i) => ({
        name: `${faker.company.name()} Hospital`,
        designation: 'HOSPITAL_ADMIN' as const,
        specialty: null,
        qualification: null,
        hospitalName: `Main Campus ${i + 1}`,
        hospitalType: 'PRIVATE' as const,
        entityHospitalType: faker.helpers.arrayElement(entityHospitalTypes),
        bedCount: faker.number.int({ min: 50, max: 500 }),
        address: faker.location.streetAddress(),
        city: i % 2 === 0 ? 'Mumbai' : 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        phone: `987652000${i}`,
        email: `hospital${i + 1}@example.com`,
        category: 'A' as const,
        territory: i % 2 === 0 ? 'Mumbai' : 'Pune',
        entityType: 'HOSPITAL' as const,
        salesRole: null,
        reportingToId: null,
        assignedToUserId: mr!.id,
        isActive: true,
      }))
    )
    .returning();

  const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai'] as const;
  const specialties = ['Cardiology', 'Oncology', 'Diabetology', 'General Medicine', 'Pediatrics'];

  const doctorRows = Array.from({ length: 18 }, (_, i) => {
    const city = cities[i % cities.length];
    const territory = city === 'Mumbai' ? 'Mumbai' : city;
    const assignedToUserId = city === 'Mumbai' ? mr!.id : faker.helpers.arrayElement([mr!.id, manager!.id]);
    return {
      name: faker.person.fullName(),
      designation: faker.helpers.arrayElement(designations),
      specialty: faker.helpers.arrayElement(specialties),
      qualification: faker.helpers.arrayElement(['MBBS', 'MD', 'MS', 'BDS', 'BPharm']),
      hospitalName: `${faker.company.name()} ${faker.helpers.arrayElement(['Hospital', 'Clinic', 'Medical Centre'])}`,
      hospitalType: faker.helpers.arrayElement(hospitalTypes),
      address: faker.location.streetAddress(),
      city,
      state:
        city === 'Mumbai'
          ? 'Maharashtra'
          : city === 'Delhi'
            ? 'Delhi'
            : city === 'Bengaluru'
              ? 'Karnataka'
              : city === 'Hyderabad'
                ? 'Telangana'
                : 'Tamil Nadu',
      pincode: faker.string.numeric(6),
      phone: `9${faker.string.numeric(9)}`,
      email: faker.internet.email().toLowerCase(),
      category: faker.helpers.arrayElement(categories),
      territory,
      entityType: 'DOCTOR' as const,
      salesRole: null,
      reportingToId: null,
      assignedToUserId,
      totalVisits: 0,
      notes: faker.lorem.sentence(),
      isActive: true,
    };
  });

  const insertedDoctors = await db.insert(persons).values(doctorRows).returning();

  const therapeutic = ['Cardio', 'Diabetes', 'Anti-infective'] as const;
  const productRows = Array.from({ length: 12 }, (_, i) => {
    const area = therapeutic[i % therapeutic.length];
    return {
      name: `${area}Brand-${i + 1}`,
      genericName: `Generic-${faker.science.chemicalElement().name}-${i}`,
      category: faker.helpers.arrayElement(productCats),
      description: faker.lorem.sentence(),
      mrp: String(faker.number.float({ min: 50, max: 2000, fractionDigits: 2 })),
      ptr: String(faker.number.float({ min: 40, max: 1600, fractionDigits: 2 })),
      pts: String(faker.number.float({ min: 35, max: 1400, fractionDigits: 2 })),
      manufacturer: faker.company.name(),
      batchNumber: `B${faker.string.alphanumeric(6).toUpperCase()}`,
      expiryDate: faker.date.future({ years: 2 }),
      stockQty: 2000,
      isActive: true,
    };
  });

  const insertedProducts = await db.insert(products).values(productRows).returning();

  const visitRows = Array.from({ length: 40 }, () => {
    const person = faker.helpers.arrayElement(insertedDoctors);
    const visitDate = faker.date.recent({ days: 90 });
    const status = faker.helpers.arrayElement(visitStatuses);
    const orderTaken = status === 'COMPLETED' && faker.datatype.boolean();
    return {
      personId: person.id,
      userId: faker.helpers.arrayElement([mr!.id, manager!.id, admin!.id]),
      visitDate,
      purpose: faker.helpers.arrayElement(visitPurposes),
      productsDiscussed: faker.helpers.arrayElements(
        insertedProducts.map((p) => p.id),
        { min: 0, max: 3 }
      ) as string[],
      samplesGiven: faker.helpers.maybe(
        () =>
          faker.helpers.arrayElements(insertedProducts, { min: 1, max: 2 }).map((p) => ({
            productId: p.id,
            qty: faker.number.int({ min: 1, max: 5 }),
          })),
        { probability: 0.4 }
      ),
      feedback: faker.lorem.sentence(),
      orderTaken,
      orderValue:
        orderTaken
          ? String(faker.number.float({ min: 500, max: 50000, fractionDigits: 2 }))
          : null,
      nextVisitDate: faker.date.soon({ days: 30, refDate: visitDate }),
      status,
    };
  });

  await db.insert(visits).values(visitRows);

  for (const p of insertedDoctors) {
    const personVisits = visitRows.filter((v) => v.personId === p.id);
    const completed = personVisits.filter((v) => v.status === 'COMPLETED');
    const last =
      completed.length > 0
        ? new Date(Math.max(...completed.map((v) => new Date(v.visitDate).getTime())))
        : null;
    await db
      .update(persons)
      .set({
        totalVisits: personVisits.filter((v) => v.status === 'COMPLETED').length,
        lastVisitDate: last,
      })
      .where(eq(persons.id, p.id));
  }

  const s1 = stockistRows[0]!;
  const s2 = stockistRows[1]!;
  const h1 = hospitalRows[0]!;
  const h2 = hospitalRows[1]!;
  const d1 = insertedDoctors[0]!;
  const p0 = insertedProducts[0]!;
  const p1 = insertedProducts[1]!;
  const p2 = insertedProducts[2]!;
  const mrEmp = mrEmployees[0]!;

  const stockMap = new Map<string, Map<string, number>>();
  const hospMap = new Map<string, Map<string, number>>();

  const movementRows: {
    movementType: Movement;
    fromEntityId: string | null;
    toEntityId: string | null;
    fromEntityType: string | null;
    toEntityType: string | null;
    productId: string;
    personId: string;
    userId: string;
    dispatchType: (typeof dispatchTypes)[number];
    quantity: number;
    dispatchDate: Date;
    status: (typeof dispatchStatuses)[number];
    totalValue: string;
    remarks: string | null;
  }[] = [
    {
      movementType: 'COMPANY_TO_STOCKIST',
      fromEntityId: null,
      toEntityId: s1.id,
      fromEntityType: 'COMPANY',
      toEntityType: 'STOCKIST',
      productId: p0.id,
      personId: s1.id,
      userId: mr!.id,
      dispatchType: 'SALE',
      quantity: 120,
      dispatchDate: faker.date.recent({ days: 30 }),
      status: 'DELIVERED',
      totalValue: '12000',
      remarks: null,
    },
    {
      movementType: 'COMPANY_TO_STOCKIST',
      fromEntityId: null,
      toEntityId: s1.id,
      fromEntityType: 'COMPANY',
      toEntityType: 'STOCKIST',
      productId: p1.id,
      personId: s1.id,
      userId: mr!.id,
      dispatchType: 'SALE',
      quantity: 80,
      dispatchDate: faker.date.recent({ days: 25 }),
      status: 'DELIVERED',
      totalValue: '8000',
      remarks: null,
    },
    {
      movementType: 'STOCKIST_TO_HOSPITAL',
      fromEntityId: s1.id,
      toEntityId: h1.id,
      fromEntityType: 'STOCKIST',
      toEntityType: 'HOSPITAL',
      productId: p0.id,
      personId: h1.id,
      userId: mr!.id,
      dispatchType: 'SALE',
      quantity: 40,
      dispatchDate: faker.date.recent({ days: 20 }),
      status: 'DELIVERED',
      totalValue: '5000',
      remarks: null,
    },
    {
      movementType: 'COMPANY_TO_HOSPITAL',
      fromEntityId: null,
      toEntityId: h2.id,
      fromEntityType: 'COMPANY',
      toEntityType: 'HOSPITAL',
      productId: p2.id,
      personId: h2.id,
      userId: manager!.id,
      dispatchType: 'SALE',
      quantity: 25,
      dispatchDate: faker.date.recent({ days: 18 }),
      status: 'DISPATCHED',
      totalValue: '4000',
      remarks: null,
    },
    {
      movementType: 'SAMPLE_TO_DOCTOR',
      fromEntityId: mrEmp.id,
      toEntityId: d1.id,
      fromEntityType: 'MR',
      toEntityType: 'DOCTOR',
      productId: p0.id,
      personId: d1.id,
      userId: mr!.id,
      dispatchType: 'SAMPLE',
      quantity: 5,
      dispatchDate: faker.date.recent({ days: 15 }),
      status: 'DELIVERED',
      totalValue: '0',
      remarks: null,
    },
    {
      movementType: 'RETURN_FROM_STOCKIST',
      fromEntityId: s1.id,
      toEntityId: null,
      fromEntityType: 'STOCKIST',
      toEntityType: 'COMPANY',
      productId: p1.id,
      personId: s1.id,
      userId: mr!.id,
      dispatchType: 'RETURN',
      quantity: 10,
      dispatchDate: faker.date.recent({ days: 12 }),
      status: 'RETURNED',
      totalValue: '0',
      remarks: null,
    },
    {
      movementType: 'RETURN_FROM_HOSPITAL',
      fromEntityId: h1.id,
      toEntityId: s1.id,
      fromEntityType: 'HOSPITAL',
      toEntityType: 'STOCKIST',
      productId: p0.id,
      personId: s1.id,
      userId: mr!.id,
      dispatchType: 'RETURN',
      quantity: 8,
      dispatchDate: faker.date.recent({ days: 10 }),
      status: 'RETURNED',
      totalValue: '0',
      remarks: null,
    },
    {
      movementType: 'STOCKIST_TO_RETAILER',
      fromEntityId: s1.id,
      toEntityId: null,
      fromEntityType: 'STOCKIST',
      toEntityType: 'RETAILER',
      productId: p0.id,
      personId: s1.id,
      userId: mr!.id,
      dispatchType: 'SALE',
      quantity: 15,
      dispatchDate: faker.date.recent({ days: 8 }),
      status: 'DELIVERED',
      totalValue: '2000',
      remarks: 'Retailer: City Chemists',
    },
    {
      movementType: 'COMPANY_TO_STOCKIST',
      fromEntityId: null,
      toEntityId: s2.id,
      fromEntityType: 'COMPANY',
      toEntityType: 'STOCKIST',
      productId: p2.id,
      personId: s2.id,
      userId: admin!.id,
      dispatchType: 'SALE',
      quantity: 60,
      dispatchDate: faker.date.recent({ days: 6 }),
      status: 'DELIVERED',
      totalValue: '9000',
      remarks: null,
    },
    {
      movementType: 'STOCKIST_TO_HOSPITAL',
      fromEntityId: s2.id,
      toEntityId: hospitalRows[2]!.id,
      fromEntityType: 'STOCKIST',
      toEntityType: 'HOSPITAL',
      productId: p2.id,
      personId: hospitalRows[2]!.id,
      userId: mr!.id,
      dispatchType: 'SALE',
      quantity: 20,
      dispatchDate: faker.date.recent({ days: 4 }),
      status: 'DELIVERED',
      totalValue: '3500',
      remarks: null,
    },
  ];

  for (const row of movementRows) {
    await db.insert(dispatches).values({
      movementType: row.movementType,
      fromEntityId: row.fromEntityId,
      toEntityId: row.toEntityId,
      fromEntityType: row.fromEntityType,
      toEntityType: row.toEntityType,
      productId: row.productId,
      personId: row.personId,
      userId: row.userId,
      dispatchType: row.dispatchType,
      quantity: row.quantity,
      batchNumber: insertedProducts.find((p) => p.id === row.productId)?.batchNumber ?? null,
      dispatchDate: row.dispatchDate,
      expectedDeliveryDate: null,
      actualDeliveryDate: row.dispatchDate,
      status: row.status,
      invoiceNumber: null,
      totalValue: row.totalValue,
      address: null,
      remarks: row.remarks,
    });

    const mt = row.movementType;
    const qty = row.quantity;
    const pid = row.productId;
    if (mt === 'COMPANY_TO_STOCKIST' || mt === 'RETURN_FROM_HOSPITAL') {
      if (row.toEntityId) bump(stockMap, row.toEntityId, pid, qty);
      if (mt === 'RETURN_FROM_HOSPITAL' && row.fromEntityId) bump(hospMap, row.fromEntityId, pid, -qty);
    }
    if (mt === 'STOCKIST_TO_HOSPITAL' || mt === 'STOCKIST_TO_RETAILER') {
      if (row.fromEntityId) bump(stockMap, row.fromEntityId, pid, -qty);
      if (mt === 'STOCKIST_TO_HOSPITAL' && row.toEntityId) bump(hospMap, row.toEntityId, pid, qty);
    }
    if (mt === 'COMPANY_TO_HOSPITAL' && row.toEntityId) bump(hospMap, row.toEntityId, pid, qty);
    if (mt === 'RETURN_FROM_STOCKIST' && row.fromEntityId) bump(stockMap, row.fromEntityId, pid, -qty);
  }

  const moveDate = new Date();
  const y = moveDate.getUTCFullYear();
  const m = String(moveDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(moveDate.getUTCDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;

  const seedMoveDate = new Date(`${dateStr}T12:00:00.000Z`);
  for (const [personId, pmap] of stockMap) {
    for (const [prodId, q] of pmap) {
      if (q <= 0) continue;
      await db.insert(stockistInventory).values({
        personId,
        productId: prodId,
        currentQty: q,
        lastMovementDate: seedMoveDate,
      });
    }
  }
  for (const [personId, pmap] of hospMap) {
    for (const [prodId, q] of pmap) {
      if (q <= 0) continue;
      await db.insert(hospitalInventory).values({
        personId,
        productId: prodId,
        currentQty: q,
        lastMovementDate: seedMoveDate,
      });
    }
  }

  const now = new Date();
  const targetRowsSeed: {
    employeeId: string;
    productId: string | null;
    month: number;
    year: number;
    targetValue: string;
    achievedValue: string;
  }[] = [];
  for (const emp of mrEmployees) {
    for (let i = 0; i < 3; i++) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      targetRowsSeed.push({
        employeeId: emp.id,
        productId: null as string | null,
        month: dt.getMonth() + 1,
        year: dt.getFullYear(),
        targetValue: String(500_000 + i * 50_000),
        achievedValue: String(320_000 + i * 40_000),
      });
    }
  }
  await db.insert(monthlyTargets).values(targetRowsSeed);

  for (let i = 0; i < insertedProducts.length; i++) {
    const prod = insertedProducts[i]!;
    let companyOut = 0;
    let companyIn = 0;
    for (const row of movementRows) {
      if (row.productId !== prod.id) continue;
      if (
        row.movementType === 'COMPANY_TO_STOCKIST' ||
        row.movementType === 'COMPANY_TO_HOSPITAL' ||
        row.movementType === 'SAMPLE_TO_DOCTOR'
      ) {
        companyOut += row.quantity;
      }
      if (row.movementType === 'RETURN_FROM_STOCKIST') companyIn += row.quantity;
    }
    const base = 2000;
    const adjusted = Math.max(0, base - companyOut + companyIn);
    await db.update(products).set({ stockQty: adjusted }).where(eq(products.id, prod.id));
  }

  console.log('Seed complete.');
  console.log('  admin@medcrm.com / Admin@123');
  console.log('  manager@medcrm.com / Manager@123');
  console.log('  mr@medcrm.com / Mr@123');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
