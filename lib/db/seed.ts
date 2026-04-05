import './load-env';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { db } from './index';
import { dispatches, persons, products, users, visits } from './schema';

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

async function main() {
  faker.seed(42_001);
  console.log('Truncating tables…');
  await db.execute(
    sql`TRUNCATE TABLE dispatches, visits, persons, products, users RESTART IDENTITY CASCADE`
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

  const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai'] as const;
  const specialties = ['Cardiology', 'Oncology', 'Diabetology', 'General Medicine', 'Pediatrics'];

  const personRows = Array.from({ length: 30 }, (_, i) => {
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
      assignedToUserId,
      totalVisits: 0,
      notes: faker.lorem.sentence(),
      isActive: true,
    };
  });

  const insertedPersons = await db.insert(persons).values(personRows).returning();

  const therapeutic = ['Cardio', 'Diabetes', 'Anti-infective'] as const;
  const productRows = Array.from({ length: 20 }, (_, i) => {
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
      stockQty: faker.number.int({ min: 0, max: 500 }),
      isActive: true,
    };
  });

  const insertedProducts = await db.insert(products).values(productRows).returning();

  const visitRows = Array.from({ length: 50 }, () => {
    const person = faker.helpers.arrayElement(insertedPersons);
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

  for (const p of insertedPersons) {
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

  const dispatchRows = Array.from({ length: 60 }, () => {
    const product = faker.helpers.arrayElement(insertedProducts);
    const person = faker.helpers.arrayElement(insertedPersons);
    const qty = faker.number.int({ min: 1, max: 20 });
    return {
      productId: product.id,
      personId: person.id,
      userId: faker.helpers.arrayElement([mr!.id, manager!.id]),
      dispatchType: faker.helpers.arrayElement(dispatchTypes),
      quantity: qty,
      batchNumber: product.batchNumber,
      dispatchDate: faker.date.recent({ days: 90 }),
      expectedDeliveryDate: faker.date.soon({ days: 7 }),
      actualDeliveryDate: faker.datatype.boolean() ? faker.date.recent({ days: 5 }) : null,
      status: faker.helpers.arrayElement(dispatchStatuses),
      invoiceNumber: faker.datatype.boolean() ? `INV-${faker.string.numeric(8)}` : null,
      totalValue: String(faker.number.float({ min: 100, max: 10000, fractionDigits: 2 })),
      address: `${person.address}, ${person.city}`,
      remarks: faker.lorem.sentence(),
    };
  });

  await db.insert(dispatches).values(dispatchRows);

  for (let i = 0; i < insertedProducts.length; i++) {
    const prod = insertedProducts[i]!;
    const base = productRows[i]!.stockQty;
    const out = dispatchRows
      .filter((d) => d.productId === prod.id && d.dispatchType !== 'RETURN')
      .reduce((s, d) => s + d.quantity, 0);
    const ret = dispatchRows
      .filter((d) => d.productId === prod.id && d.dispatchType === 'RETURN')
      .reduce((s, d) => s + d.quantity, 0);
    const adjusted = Math.max(0, base - out + ret);
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
