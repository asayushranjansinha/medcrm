import './load-env';
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

// ─── Static reference data ───────────────────────────────────────────────────

const CITIES = [
  { city: 'Mumbai',    state: 'Maharashtra', territory: 'Mumbai'    },
  { city: 'Delhi',     state: 'Delhi',       territory: 'Delhi'     },
  { city: 'Bengaluru', state: 'Karnataka',   territory: 'Bengaluru' },
  { city: 'Hyderabad', state: 'Telangana',   territory: 'Hyderabad' },
  { city: 'Chennai',   state: 'Tamil Nadu',  territory: 'Chennai'   },
  { city: 'Pune',      state: 'Maharashtra', territory: 'Pune'      },
  { city: 'Kolkata',   state: 'West Bengal', territory: 'Kolkata'   },
];

// Real Cipla products with accurate generic names, categories and pricing
const CIPLA_PRODUCTS = [
  { name: 'Cipla Azithral 500',    genericName: 'Azithromycin 500mg',           category: 'TABLET'   as const, therapeuticArea: 'Anti-infective',  mrp: 148.50,  ptr: 118.80, pts: 104.50, strength: '500mg',     packSize: '3 tablets'   },
  { name: 'Cipla Formonide 200',   genericName: 'Formoterol + Budesonide 200',  category: 'DEVICE'   as const, therapeuticArea: 'Respiratory',      mrp: 545.00,  ptr: 436.00, pts: 383.00, strength: '200mcg',    packSize: '120 doses'   },
  { name: 'Cipla Atorva 10',       genericName: 'Atorvastatin 10mg',            category: 'TABLET'   as const, therapeuticArea: 'Cardiology',       mrp: 89.20,   ptr: 71.36,  pts: 62.80,  strength: '10mg',      packSize: '15 tablets'  },
  { name: 'Cipla Gluconorm-G 2',   genericName: 'Glimepiride + Metformin 2mg',  category: 'TABLET'   as const, therapeuticArea: 'Diabetes',         mrp: 132.00,  ptr: 105.60, pts: 92.90,  strength: '2mg/500mg', packSize: '20 tablets'  },
  { name: 'Cipla Omez 20',         genericName: 'Omeprazole 20mg',              category: 'CAPSULE'  as const, therapeuticArea: 'Gastroenterology', mrp: 62.50,   ptr: 50.00,  pts: 44.00,  strength: '20mg',      packSize: '15 capsules' },
  { name: 'Cipla Ciphylline',      genericName: 'Theophylline SR 300mg',        category: 'TABLET'   as const, therapeuticArea: 'Respiratory',      mrp: 74.00,   ptr: 59.20,  pts: 52.10,  strength: '300mg',     packSize: '10 tablets'  },
  { name: 'Cipla Meronem 1g',      genericName: 'Meropenem 1g',                 category: 'INJECTION'as const, therapeuticArea: 'Anti-infective',  mrp: 1820.00, ptr: 1456.00,pts: 1280.00,strength: '1g',        packSize: '1 vial'      },
  { name: 'Cipla Duolin Respules', genericName: 'Ipratropium + Levosalbutamol', category: 'SYRUP'    as const, therapeuticArea: 'Respiratory',      mrp: 96.00,   ptr: 76.80,  pts: 67.50,  strength: '0.5mg/1.25mg',packSize: '5 respules' },
  { name: 'Cipla Amlopres AT',     genericName: 'Amlodipine + Atenolol 5/50',  category: 'TABLET'   as const, therapeuticArea: 'Cardiology',       mrp: 110.00,  ptr: 88.00,  pts: 77.50,  strength: '5mg/50mg',  packSize: '15 tablets'  },
  { name: 'Cipla Metpure XL 25',   genericName: 'Metoprolol Succinate 25mg',    category: 'TABLET'   as const, therapeuticArea: 'Cardiology',       mrp: 95.50,   ptr: 76.40,  pts: 67.20,  strength: '25mg',      packSize: '15 tablets'  },
  { name: 'Cipla Ceftum 500',      genericName: 'Cefuroxime Axetil 500mg',      category: 'TABLET'   as const, therapeuticArea: 'Anti-infective',  mrp: 218.00,  ptr: 174.40, pts: 153.50, strength: '500mg',     packSize: '6 tablets'   },
  { name: 'Cipla Seroflo 250',     genericName: 'Salmeterol + Fluticasone 250', category: 'DEVICE'   as const, therapeuticArea: 'Respiratory',      mrp: 720.00,  ptr: 576.00, pts: 506.50, strength: '250mcg',    packSize: '120 doses'   },
  { name: 'Cipla Tazact 4.5g',     genericName: 'Piperacillin + Tazobactam',    category: 'INJECTION'as const, therapeuticArea: 'Anti-infective',  mrp: 485.00,  ptr: 388.00, pts: 341.50, strength: '4.5g',      packSize: '1 vial'      },
  { name: 'Cipla Glimisave M1',    genericName: 'Glimepiride + Metformin 1mg',  category: 'TABLET'   as const, therapeuticArea: 'Diabetes',         mrp: 98.00,   ptr: 78.40,  pts: 69.00,  strength: '1mg/500mg', packSize: '20 tablets'  },
  { name: 'Cipla Pantop 40',       genericName: 'Pantoprazole 40mg',            category: 'TABLET'   as const, therapeuticArea: 'Gastroenterology', mrp: 55.00,   ptr: 44.00,  pts: 38.70,  strength: '40mg',      packSize: '15 tablets'  },
];

// Real Indian doctor names with appropriate specialties
const DOCTORS_DATA = [
  { name: 'Dr. Ramesh Gupta',        specialty: 'Cardiology',       qualification: 'MD, DM (Cardiology)',   salutation: 'Dr.' },
  { name: 'Dr. Sunita Krishnamurthy',specialty: 'Diabetology',      qualification: 'MBBS, MD (Medicine)',   salutation: 'Dr.' },
  { name: 'Dr. Anil Bhatia',         specialty: 'Pulmonology',      qualification: 'MBBS, MD, DM',          salutation: 'Dr.' },
  { name: 'Dr. Priya Nair',          specialty: 'General Medicine',  qualification: 'MBBS, MD',              salutation: 'Dr.' },
  { name: 'Dr. Suresh Iyengar',      specialty: 'Gastroenterology', qualification: 'MBBS, MD, DM (Gastro)', salutation: 'Dr.' },
  { name: 'Dr. Meena Pillai',        specialty: 'Cardiology',       qualification: 'MBBS, DM (Cardiology)', salutation: 'Dr.' },
  { name: 'Dr. Vikrant Joshi',       specialty: 'Diabetology',      qualification: 'MD (Medicine), MRCP',   salutation: 'Dr.' },
  { name: 'Dr. Anita Desai',         specialty: 'Respiratory',      qualification: 'MBBS, MD (Pulmonology)',salutation: 'Dr.' },
  { name: 'Dr. Rajiv Khanna',        specialty: 'Cardiology',       qualification: 'MBBS, DM, FACC',        salutation: 'Dr.' },
  { name: 'Dr. Kavitha Raman',       specialty: 'General Medicine',  qualification: 'MBBS, MD',              salutation: 'Dr.' },
  { name: 'Dr. Santosh Pawar',       specialty: 'Anti-infective',   qualification: 'MBBS, MD (Micro)',      salutation: 'Dr.' },
  { name: 'Dr. Deepa Menon',         specialty: 'Diabetology',      qualification: 'MBBS, MD, DNB',         salutation: 'Dr.' },
  { name: 'Dr. Harish Malhotra',     specialty: 'Cardiology',       qualification: 'MBBS, MD, DM',          salutation: 'Dr.' },
  { name: 'Dr. Rohini Saxena',       specialty: 'Gastroenterology', qualification: 'MBBS, MS, DNB',         salutation: 'Dr.' },
  { name: 'Dr. Naresh Patel',        specialty: 'Respiratory',      qualification: 'MBBS, MD (Pulmo)',      salutation: 'Dr.' },
  { name: 'Dr. Smita Kulkarni',      specialty: 'General Medicine',  qualification: 'MBBS, MD',              salutation: 'Dr.' },
  { name: 'Dr. Girish Rao',          specialty: 'Cardiology',       qualification: 'DM (Cardiology), FRCP', salutation: 'Dr.' },
  { name: 'Dr. Usha Thyagarajan',    specialty: 'Diabetology',      qualification: 'MD, PGDDE',             salutation: 'Dr.' },
  { name: 'Dr. Mahesh Choudhary',    specialty: 'Anti-infective',   qualification: 'MBBS, MD (Medicine)',   salutation: 'Dr.' },
  { name: 'Dr. Lalitha Venkatesh',   specialty: 'Gastroenterology', qualification: 'MBBS, DM (Gastro)',     salutation: 'Dr.' },
  { name: 'Dr. Pawan Agarwal',       specialty: 'Respiratory',      qualification: 'MBBS, MD, FCCP',        salutation: 'Dr.' },
  { name: 'Dr. Rekha Bhatt',         specialty: 'General Medicine',  qualification: 'MBBS, MD',              salutation: 'Dr.' },
  { name: 'Dr. Sanjay Tripathi',     specialty: 'Cardiology',       qualification: 'DM, FACC, FSCAI',      salutation: 'Dr.' },
  { name: 'Dr. Nandita Iyer',        specialty: 'Diabetology',      qualification: 'MBBS, MD, CDE',         salutation: 'Dr.' },
  { name: 'Dr. Rajesh Tiwari',       specialty: 'Anti-infective',   qualification: 'MBBS, MD (ID)',         salutation: 'Dr.' },
];

// Real Indian hospital names
const HOSPITALS_DATA = [
  { name: 'Lilavati Hospital',              type: 'PRIVATE_HOSPITAL' as const, city: 'Mumbai',    bedCount: 323  },
  { name: 'Kokilaben Dhirubhai Ambani',     type: 'PRIVATE_HOSPITAL' as const, city: 'Mumbai',    bedCount: 750  },
  { name: 'Hinduja Hospital',               type: 'PRIVATE_HOSPITAL' as const, city: 'Mumbai',    bedCount: 351  },
  { name: 'KEM Hospital',                   type: 'GOVT_HOSPITAL'    as const, city: 'Mumbai',    bedCount: 1800 },
  { name: 'Medanta - The Medicity',         type: 'PRIVATE_HOSPITAL' as const, city: 'Delhi',     bedCount: 1250 },
  { name: 'Apollo Hospital Indraprastha',   type: 'PRIVATE_HOSPITAL' as const, city: 'Delhi',     bedCount: 710  },
  { name: 'AIIMS Delhi',                    type: 'GOVT_HOSPITAL'    as const, city: 'Delhi',     bedCount: 2478 },
  { name: 'Manipal Hospital Old Airport',   type: 'PRIVATE_HOSPITAL' as const, city: 'Bengaluru', bedCount: 600  },
  { name: 'Narayana Health City',           type: 'PRIVATE_HOSPITAL' as const, city: 'Bengaluru', bedCount: 3000 },
  { name: 'Vikram Hospital',                type: 'PRIVATE_HOSPITAL' as const, city: 'Bengaluru', bedCount: 250  },
  { name: 'Yashoda Hospital Somajiguda',    type: 'PRIVATE_HOSPITAL' as const, city: 'Hyderabad', bedCount: 500  },
  { name: 'NIMS Hyderabad',                 type: 'GOVT_HOSPITAL'    as const, city: 'Hyderabad', bedCount: 1700 },
  { name: 'Apollo Hospital Greams Road',    type: 'PRIVATE_HOSPITAL' as const, city: 'Chennai',   bedCount: 560  },
  { name: 'MIOT International',             type: 'PRIVATE_HOSPITAL' as const, city: 'Chennai',   bedCount: 1000 },
  { name: 'Ruby Hall Clinic',               type: 'PRIVATE_HOSPITAL' as const, city: 'Pune',      bedCount: 450  },
];

// Real Indian stockist/distributor names
const STOCKISTS_DATA = [
  { name: 'Arihant Medical Agency',     ownerName: 'Sunil Arihant',    city: 'Mumbai',    territory: 'Mumbai',    zone: 'West', region: 'MH-1', gstin: '27AABCA1234A1Z1' },
  { name: 'Bharat Drug House',          ownerName: 'Dinesh Mehta',     city: 'Mumbai',    territory: 'Mumbai',    zone: 'West', region: 'MH-1', gstin: '27AABCB5678B1Z2' },
  { name: 'Shree Medicos Distributor',  ownerName: 'Ramesh Chand',     city: 'Delhi',     territory: 'Delhi',     zone: 'North',region: 'DL-1', gstin: '07AABCS9012C1Z3' },
  { name: 'National Pharma Agencies',   ownerName: 'Vikram Luthra',    city: 'Delhi',     territory: 'Delhi',     zone: 'North',region: 'DL-1', gstin: '07AABCN3456D1Z4' },
  { name: 'Karnataka Drug Distributors',ownerName: 'Suresh Gowda',     city: 'Bengaluru', territory: 'Bengaluru', zone: 'South',region: 'KA-1', gstin: '29AABCK7890E1Z5' },
  { name: 'Deccan Medical Suppliers',   ownerName: 'Ravi Shankar',     city: 'Hyderabad', territory: 'Hyderabad', zone: 'South',region: 'TS-1', gstin: '36AABCD2345F1Z6' },
  { name: 'Tamil Nadu Pharma Depot',    ownerName: 'Murugan Pillai',   city: 'Chennai',   territory: 'Chennai',   zone: 'South',region: 'TN-1', gstin: '33AABCT6789G1Z7' },
  { name: 'Pune Medical Mart',          ownerName: 'Ajay Kulkarni',    city: 'Pune',      territory: 'Pune',      zone: 'West', region: 'MH-2', gstin: '27AABCP0123H1Z8' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function indianPhone(): string {
  const starts = ['6', '7', '8', '9'];
  return `${pick(starts)}${Array.from({ length: 9 }, () => randInt(0, 9)).join('')}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysSoon(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

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

type Movement =
  | 'COMPANY_TO_STOCKIST'
  | 'STOCKIST_TO_HOSPITAL'
  | 'STOCKIST_TO_RETAILER'
  | 'COMPANY_TO_HOSPITAL'
  | 'SAMPLE_TO_DOCTOR'
  | 'RETURN_FROM_STOCKIST'
  | 'RETURN_FROM_HOSPITAL'
  | 'ADJUSTMENT';

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('⏳ Clearing all tables…');
  await db.execute(
    sql`TRUNCATE TABLE dispatches, visits, stockist_inventory, hospital_inventory, monthly_targets, persons, products, users RESTART IDENTITY CASCADE`
  );
  console.log('✅ Tables cleared.');

  // ── 1. USERS (auth accounts) ──────────────────────────────────────────────
  console.log('👤 Seeding users…');

  const adminHash    = bcrypt.hashSync('Admin@123',   10);
  const managerHash  = bcrypt.hashSync('Manager@123', 10);
  const mrHash       = bcrypt.hashSync('Mr@123',      10);

  const [admin, nsmUser, zsmUser, rsmUser, asmUser, mrUser1, mrUser2, mrUser3] = await db
    .insert(users)
    .values([
      { name: 'System Admin',        email: 'admin@medcrm.com',        password: adminHash,   role: 'ADMIN',   territory: 'All India', phone: '9000000001' },
      { name: 'Asha Mehta',          email: 'nsm@medcrm.com',          password: managerHash, role: 'MANAGER', territory: 'All India', phone: '9000000002' },
      { name: 'Vikram Singh',        email: 'zsm.north@medcrm.com',    password: managerHash, role: 'MANAGER', territory: 'North',     phone: '9000000003' },
      { name: 'Deepak Malhotra',     email: 'rsm.delhi@medcrm.com',    password: managerHash, role: 'MANAGER', territory: 'Delhi',     phone: '9000000004' },
      { name: 'Suresh Gaikwad',      email: 'asm.mumbai@medcrm.com',   password: managerHash, role: 'MANAGER', territory: 'Mumbai',    phone: '9000000005' },
      { name: 'Rahul Verma',         email: 'mr1@medcrm.com',          password: mrHash,      role: 'MR',      territory: 'Mumbai',    phone: '9000000006' },
      { name: 'Neha Kapoor',         email: 'mr2@medcrm.com',          password: mrHash,      role: 'MR',      territory: 'Delhi',     phone: '9000000007' },
      { name: 'Sanjay Patil',        email: 'mr3@medcrm.com',          password: mrHash,      role: 'MR',      territory: 'Bengaluru', phone: '9000000008' },
    ])
    .returning();

  // ── 2. EMPLOYEE PERSONS (hierarchy) ──────────────────────────────────────
  console.log('🏢 Seeding employee hierarchy…');

  const baseEmp = {
    designation: 'OTHER' as const,
    hospitalName: 'Cipla Ltd. HQ',
    hospitalType: 'PRIVATE' as const,
    address: 'Cipla House, Peninsula Business Park, Lower Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400013',
    category: 'A' as const,
    isActive: true,
    entityType: 'EMPLOYEE' as const,
  };

  const [nsm] = await db.insert(persons).values({
    ...baseEmp,
    name: 'Asha Mehta',
    email: 'nsm@medcrm.com',
    phone: '9000000002',
    territory: 'All India',
    salesRole: 'NSM',
    reportingToId: null,
    assignedToUserId: nsmUser!.id,
    zone: 'All India',
    region: 'All India',
  }).returning();

  const [zsm] = await db.insert(persons).values({
    ...baseEmp,
    name: 'Vikram Singh',
    email: 'zsm.north@medcrm.com',
    phone: '9000000003',
    territory: 'North',
    salesRole: 'ZSM',
    reportingToId: nsm!.id,
    assignedToUserId: zsmUser!.id,
    zone: 'North',
    region: 'North',
  }).returning();

  const [rsm] = await db.insert(persons).values({
    ...baseEmp,
    name: 'Deepak Malhotra',
    email: 'rsm.delhi@medcrm.com',
    phone: '9000000004',
    territory: 'Delhi',
    salesRole: 'RSM',
    reportingToId: zsm!.id,
    assignedToUserId: rsmUser!.id,
    zone: 'North',
    region: 'DL-1',
  }).returning();

  const [asm] = await db.insert(persons).values({
    ...baseEmp,
    name: 'Suresh Gaikwad',
    email: 'asm.mumbai@medcrm.com',
    phone: '9000000005',
    territory: 'Mumbai',
    salesRole: 'ASM',
    reportingToId: nsm!.id,
    assignedToUserId: asmUser!.id,
    zone: 'West',
    region: 'MH-1',
  }).returning();

  const mrEmployees = await db.insert(persons).values([
    {
      ...baseEmp,
      name: 'Rahul Verma',
      email: 'mr1@medcrm.com',
      phone: '9000000006',
      territory: 'Mumbai',
      salesRole: 'MR',
      reportingToId: asm!.id,
      assignedToUserId: mrUser1!.id,
      zone: 'West',
      region: 'MH-1',
    },
    {
      ...baseEmp,
      name: 'Neha Kapoor',
      email: 'mr2@medcrm.com',
      phone: '9000000007',
      territory: 'Delhi',
      salesRole: 'MR',
      reportingToId: rsm!.id,
      assignedToUserId: mrUser2!.id,
      zone: 'North',
      region: 'DL-1',
    },
    {
      ...baseEmp,
      name: 'Sanjay Patil',
      email: 'mr3@medcrm.com',
      phone: '9000000008',
      territory: 'Bengaluru',
      salesRole: 'MR',
      reportingToId: nsm!.id,
      assignedToUserId: mrUser3!.id,
      zone: 'South',
      region: 'KA-1',
    },
  ]).returning();

  const [mrEmp1, mrEmp2, mrEmp3] = mrEmployees;

  // ── 3. STOCKISTS ──────────────────────────────────────────────────────────
  console.log('🏪 Seeding stockists…');

  const assignedMrs = [mrEmp1!.id, mrEmp1!.id, mrEmp2!.id, mrEmp2!.id, mrEmp3!.id, mrEmp3!.id, mrEmp3!.id, mrEmp1!.id];
  const assignedMrUsers = [mrUser1!.id, mrUser1!.id, mrUser2!.id, mrUser2!.id, mrUser3!.id, mrUser3!.id, mrUser3!.id, mrUser1!.id];

  const stockistRows = await db.insert(persons).values(
    STOCKISTS_DATA.map((s, i) => ({
      name: s.name,
      designation: 'OTHER' as const,
      hospitalName: s.name,
      hospitalType: 'PRIVATE' as const,
      address: `${randInt(1, 999)}, Industrial Estate`,
      city: s.city,
      state: CITIES.find(c => c.city === s.city)?.state ?? 'Maharashtra',
      pincode: `${randInt(100000, 999999)}`,
      phone: indianPhone(),
      email: `${s.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      category: pick(['A', 'B', 'C'] as const),
      territory: s.territory,
      entityType: 'STOCKIST' as const,
      salesRole: null,
      reportingToId: null,
      assignedToUserId: assignedMrUsers[i] ?? mrUser1!.id,
      stockistCode: `STK-${String(101 + i).padStart(3, '0')}`,
      gstin: s.gstin,
      zone: s.zone,
      region: s.region,
      creditLimit: String(randInt(200000, 1000000)),
      outstandingAmount: String(randInt(10000, 150000)),
      isActive: true,
    }))
  ).returning();

  // ── 4. HOSPITALS ──────────────────────────────────────────────────────────
  console.log('🏥 Seeding hospitals…');

  const mrUserByCity: Record<string, string> = {
    'Mumbai':    mrUser1!.id,
    'Delhi':     mrUser2!.id,
    'Bengaluru': mrUser3!.id,
    'Hyderabad': mrUser3!.id,
    'Chennai':   mrUser3!.id,
    'Pune':      mrUser1!.id,
  };

  const hospitalRows = await db.insert(persons).values(
    HOSPITALS_DATA.map((h, i) => {
      const loc = CITIES.find(c => c.city === h.city)!;
      return {
        name: h.name,
        designation: 'HOSPITAL_ADMIN' as const,
        hospitalName: h.name,
        hospitalType: 'PRIVATE' as const,
        entityHospitalType: h.type,
        bedCount: h.bedCount,
        address: `${randInt(1, 99)}, ${h.city} Central Road`,
        city: h.city,
        state: loc.state,
        pincode: `${randInt(100000, 999999)}`,
        phone: indianPhone(),
        email: `contact@${h.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.in`,
        category: pick(['A', 'B', 'C'] as const),
        territory: loc.territory,
        entityType: 'HOSPITAL' as const,
        salesRole: null,
        reportingToId: null,
        assignedToUserId: mrUserByCity[h.city] ?? mrUser1!.id,
        hospitalCode: `HSP-${String(101 + i).padStart(3, '0')}`,
        isActive: true,
      };
    })
  ).returning();

  // ── 5. DOCTORS ────────────────────────────────────────────────────────────
  console.log('👨‍⚕️ Seeding doctors…');

  const doctorRows = await db.insert(persons).values(
    DOCTORS_DATA.map((d, i) => {
      const loc = CITIES[i % CITIES.length]!;
      const linkedHospital = hospitalRows.find(h => h.city === loc.city);
      return {
        name: d.name,
        designation: 'DOCTOR' as const,
        specialty: d.specialty,
        qualification: d.qualification,
        hospitalName: linkedHospital?.name ?? `${loc.city} General Hospital`,
        hospitalType: 'PRIVATE' as const,
        address: `Chamber ${randInt(100, 999)}, Medical Complex`,
        city: loc.city,
        state: loc.state,
        pincode: `${randInt(100000, 999999)}`,
        phone: indianPhone(),
        email: `${d.name.toLowerCase().replace(/[^a-z]/g, '.')}${i}@gmail.com`,
        category: pick(['A', 'B', 'C'] as const),
        territory: loc.territory,
        entityType: 'DOCTOR' as const,
        salesRole: null,
        reportingToId: null,
        assignedToUserId: mrUserByCity[loc.city] ?? mrUser1!.id,
        totalVisits: 0,
        isActive: true,
      };
    })
  ).returning();

  // ── 6. PRODUCTS ───────────────────────────────────────────────────────────
  console.log('💊 Seeding Cipla products…');

  const insertedProducts = await db.insert(products).values(
    CIPLA_PRODUCTS.map((p, i) => ({
      name: p.name,
      genericName: p.genericName,
      category: p.category,
      description: `${p.genericName} — ${p.therapeuticArea} segment. Pack: ${p.packSize}.`,
      mrp:  String(p.mrp.toFixed(2)),
      ptr:  String(p.ptr.toFixed(2)),
      pts:  String(p.pts.toFixed(2)),
      manufacturer: 'Cipla Ltd.',
      batchNumber: `CP${String(2024000 + i).slice(-6)}`,
      expiryDate: daysSoon(randInt(365, 900)),
      stockQty: 5000,
      isActive: true,
    }))
  ).returning();

  // ── 7. VISITS ─────────────────────────────────────────────────────────────
  console.log('🚶 Seeding visits…');

  const visitPurposes = ['DETAILING', 'SAMPLE_DROP', 'FOLLOW_UP', 'ORDER_COLLECTION', 'OTHER'] as const;
  const visitStatuses = ['PLANNED', 'COMPLETED', 'CANCELLED'] as const;
  const visitOutcomes = ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NOT_MET'] as const;

  const visitRows: (typeof visits.$inferInsert)[] = [];

  for (let i = 0; i < 60; i++) {
    const doctor = doctorRows[i % doctorRows.length]!;
    const mrUserId = mrUserByCity[doctor.city!] ?? mrUser1!.id;
    const daysBack = randInt(1, 90);
    const status = pick(visitStatuses);
    const outcome = status === 'COMPLETED' ? pick(visitOutcomes) : undefined;
    const orderTaken = status === 'COMPLETED' && Math.random() < 0.4;
    const discussed = pickN(insertedProducts, randInt(1, 3)).map((p) => p.id);

    const baseFeedback = pick([
      'Doctor showed interest in Atorva 10.',
      'Positive response to Formonide. Will prescribe.',
      'Asked for more samples of Azithral.',
      'Neutral meeting. Follow-up scheduled.',
      'Doctor not available. Left literature.',
      'Discussed Gluconorm-G. Good engagement.',
    ]);
    const feedback =
      outcome != null ? `${baseFeedback} Outcome: ${outcome}.` : baseFeedback;
    const prescriptionCommitment =
      status === 'COMPLETED' && outcome === 'POSITIVE' && Math.random() < 0.65;

    visitRows.push({
      personId: doctor.id,
      userId: mrUserId,
      visitDate: daysAgo(daysBack),
      purpose: pick(visitPurposes),
      productsDiscussed: discussed,
      samplesGiven:
        Math.random() < 0.4
          ? pickN(insertedProducts, randInt(1, 2)).map((p) => ({ productId: p.id, qty: randInt(1, 5) }))
          : null,
      feedback,
      orderTaken,
      orderValue: orderTaken ? String(randInt(5000, 80000)) : null,
      nextVisitDate: daysSoon(randInt(7, 45)),
      status,
      visitType: 'DOCTOR_VISIT' as const,
      outcome: outcome ?? undefined,
      prescriptionCommitment,
    });
  }

  // Stockist visits
  for (let i = 0; i < 15; i++) {
    const stockist = stockistRows[i % stockistRows.length]!;
    visitRows.push({
      personId: stockist.id,
      userId: mrUserByCity[stockist.city!] ?? mrUser1!.id,
      visitDate: daysAgo(randInt(1, 60)),
      purpose: 'ORDER_COLLECTION',
      status: 'COMPLETED',
      orderTaken: true,
      orderValue: String(randInt(20000, 200000)),
      feedback: 'Collected order. Stock levels discussed. Outcome: POSITIVE.',
      nextVisitDate: daysSoon(randInt(14, 30)),
      productsDiscussed: pickN(insertedProducts, 2).map((p) => p.id),
      visitType: 'STOCKIST_VISIT' as const,
      outcome: 'POSITIVE',
      prescriptionCommitment: false,
    });
  }

  await db.insert(visits).values(visitRows);

  // Update totalVisits + lastVisitDate on doctors
  for (const doc of doctorRows) {
    const docVisits = visitRows.filter(v => v.personId === doc.id && v.status === 'COMPLETED');
    const last = docVisits.length > 0
      ? new Date(Math.max(...docVisits.map(v => new Date(v.visitDate!).getTime())))
      : null;
    await db.update(persons).set({
      totalVisits:   docVisits.length,
      lastVisitDate: last,
    }).where(eq(persons.id, doc.id));
  }

  // ── 8. STOCK MOVEMENTS ────────────────────────────────────────────────────
  console.log('📦 Seeding stock movements…');

  const stockMap = new Map<string, Map<string, number>>();
  const hospMap  = new Map<string, Map<string, number>>();

  type DispatchRow = typeof dispatches.$inferInsert & {
    movementType: Movement;
  };

  const movementRows: DispatchRow[] = [
    // Company → Stockist (initial fill for s1, s2, s3)
    { movementType:'COMPANY_TO_STOCKIST', fromEntityType:'COMPANY', fromEntityId:null,               toEntityType:'STOCKIST', toEntityId:stockistRows[0]!.id, productId:insertedProducts[0]!.id,  personId:stockistRows[0]!.id, userId:mrUser1!.id, dispatchType:'SALE',   quantity:200, dispatchDate:daysAgo(28), status:'DELIVERED', totalValue:'17840', batchNumber:'CP202400', invoiceNumber:'INV-2024-001' },
    { movementType:'COMPANY_TO_STOCKIST', fromEntityType:'COMPANY', fromEntityId:null,               toEntityType:'STOCKIST', toEntityId:stockistRows[0]!.id, productId:insertedProducts[2]!.id,  personId:stockistRows[0]!.id, userId:mrUser1!.id, dispatchType:'SALE',   quantity:150, dispatchDate:daysAgo(27), status:'DELIVERED', totalValue:'9405',  batchNumber:'CP202402', invoiceNumber:'INV-2024-002' },
    { movementType:'COMPANY_TO_STOCKIST', fromEntityType:'COMPANY', fromEntityId:null,               toEntityType:'STOCKIST', toEntityId:stockistRows[0]!.id, productId:insertedProducts[3]!.id,  personId:stockistRows[0]!.id, userId:mrUser1!.id, dispatchType:'SALE',   quantity:100, dispatchDate:daysAgo(26), status:'DELIVERED', totalValue:'6900',  batchNumber:'CP202403', invoiceNumber:'INV-2024-003' },
    { movementType:'COMPANY_TO_STOCKIST', fromEntityType:'COMPANY', fromEntityId:null,               toEntityType:'STOCKIST', toEntityId:stockistRows[1]!.id, productId:insertedProducts[1]!.id,  personId:stockistRows[1]!.id, userId:mrUser1!.id, dispatchType:'SALE',   quantity:80,  dispatchDate:daysAgo(25), status:'DELIVERED', totalValue:'30640', batchNumber:'CP202401', invoiceNumber:'INV-2024-004' },
    { movementType:'COMPANY_TO_STOCKIST', fromEntityType:'COMPANY', fromEntityId:null,               toEntityType:'STOCKIST', toEntityId:stockistRows[1]!.id, productId:insertedProducts[8]!.id,  personId:stockistRows[1]!.id, userId:mrUser1!.id, dispatchType:'SALE',   quantity:120, dispatchDate:daysAgo(24), status:'DELIVERED', totalValue:'9300',  batchNumber:'CP202408', invoiceNumber:'INV-2024-005' },
    { movementType:'COMPANY_TO_STOCKIST', fromEntityType:'COMPANY', fromEntityId:null,               toEntityType:'STOCKIST', toEntityId:stockistRows[2]!.id, productId:insertedProducts[4]!.id,  personId:stockistRows[2]!.id, userId:mrUser2!.id, dispatchType:'SALE',   quantity:200, dispatchDate:daysAgo(22), status:'DELIVERED', totalValue:'8800',  batchNumber:'CP202404', invoiceNumber:'INV-2024-006' },
    { movementType:'COMPANY_TO_STOCKIST', fromEntityType:'COMPANY', fromEntityId:null,               toEntityType:'STOCKIST', toEntityId:stockistRows[2]!.id, productId:insertedProducts[10]!.id, personId:stockistRows[2]!.id, userId:mrUser2!.id, dispatchType:'SALE',   quantity:50,  dispatchDate:daysAgo(21), status:'DELIVERED', totalValue:'7675',  batchNumber:'CP202410', invoiceNumber:'INV-2024-007' },
    { movementType:'COMPANY_TO_STOCKIST', fromEntityType:'COMPANY', fromEntityId:null,               toEntityType:'STOCKIST', toEntityId:stockistRows[4]!.id, productId:insertedProducts[11]!.id, personId:stockistRows[4]!.id, userId:mrUser3!.id, dispatchType:'SALE',   quantity:60,  dispatchDate:daysAgo(20), status:'DELIVERED', totalValue:'30390', batchNumber:'CP202411', invoiceNumber:'INV-2024-008' },
    { movementType:'COMPANY_TO_STOCKIST', fromEntityType:'COMPANY', fromEntityId:null,               toEntityType:'STOCKIST', toEntityId:stockistRows[4]!.id, productId:insertedProducts[6]!.id,  personId:stockistRows[4]!.id, userId:mrUser3!.id, dispatchType:'SALE',   quantity:30,  dispatchDate:daysAgo(19), status:'DELIVERED', totalValue:'38400', batchNumber:'CP202406', invoiceNumber:'INV-2024-009' },

    // Stockist → Hospital
    { movementType:'STOCKIST_TO_HOSPITAL', fromEntityType:'STOCKIST', fromEntityId:stockistRows[0]!.id, toEntityType:'HOSPITAL', toEntityId:hospitalRows[0]!.id, productId:insertedProducts[0]!.id, personId:hospitalRows[0]!.id, userId:mrUser1!.id, dispatchType:'SALE', quantity:60,  dispatchDate:daysAgo(18), status:'DELIVERED', totalValue:'5093', batchNumber:'CP202400', invoiceNumber:'INV-2024-010' },
    { movementType:'STOCKIST_TO_HOSPITAL', fromEntityType:'STOCKIST', fromEntityId:stockistRows[0]!.id, toEntityType:'HOSPITAL', toEntityId:hospitalRows[1]!.id, productId:insertedProducts[2]!.id, personId:hospitalRows[1]!.id, userId:mrUser1!.id, dispatchType:'SALE', quantity:40,  dispatchDate:daysAgo(16), status:'DELIVERED', totalValue:'2854', batchNumber:'CP202402', invoiceNumber:'INV-2024-011' },
    { movementType:'STOCKIST_TO_HOSPITAL', fromEntityType:'STOCKIST', fromEntityId:stockistRows[0]!.id, toEntityType:'HOSPITAL', toEntityId:hospitalRows[0]!.id, productId:insertedProducts[3]!.id, personId:hospitalRows[0]!.id, userId:mrUser1!.id, dispatchType:'SALE', quantity:30,  dispatchDate:daysAgo(14), status:'DELIVERED', totalValue:'2079', batchNumber:'CP202403', invoiceNumber:'INV-2024-012' },
    { movementType:'STOCKIST_TO_HOSPITAL', fromEntityType:'STOCKIST', fromEntityId:stockistRows[2]!.id, toEntityType:'HOSPITAL', toEntityId:hospitalRows[4]!.id, productId:insertedProducts[4]!.id, personId:hospitalRows[4]!.id, userId:mrUser2!.id, dispatchType:'SALE', quantity:80,  dispatchDate:daysAgo(13), status:'DELIVERED', totalValue:'3520', batchNumber:'CP202404', invoiceNumber:'INV-2024-013' },
    { movementType:'STOCKIST_TO_HOSPITAL', fromEntityType:'STOCKIST', fromEntityId:stockistRows[4]!.id, toEntityType:'HOSPITAL', toEntityId:hospitalRows[7]!.id, productId:insertedProducts[11]!.id,personId:hospitalRows[7]!.id, userId:mrUser3!.id, dispatchType:'SALE', quantity:20,  dispatchDate:daysAgo(10), status:'DELIVERED', totalValue:'10130',batchNumber:'CP202411', invoiceNumber:'INV-2024-014' },
    { movementType:'STOCKIST_TO_HOSPITAL', fromEntityType:'STOCKIST', fromEntityId:stockistRows[1]!.id, toEntityType:'HOSPITAL', toEntityId:hospitalRows[2]!.id, productId:insertedProducts[8]!.id, personId:hospitalRows[2]!.id, userId:mrUser1!.id, dispatchType:'SALE', quantity:35,  dispatchDate:daysAgo(9),  status:'DELIVERED', totalValue:'2719', batchNumber:'CP202408', invoiceNumber:'INV-2024-015' },

    // Direct Company → Hospital
    { movementType:'COMPANY_TO_HOSPITAL', fromEntityType:'COMPANY', fromEntityId:null, toEntityType:'HOSPITAL', toEntityId:hospitalRows[3]!.id, productId:insertedProducts[6]!.id,  personId:hospitalRows[3]!.id, userId:asmUser!.id, dispatchType:'SALE',   quantity:15,  dispatchDate:daysAgo(15), status:'DELIVERED', totalValue:'19200', batchNumber:'CP202406', invoiceNumber:'INV-2024-016' },
    { movementType:'COMPANY_TO_HOSPITAL', fromEntityType:'COMPANY', fromEntityId:null, toEntityType:'HOSPITAL', toEntityId:hospitalRows[6]!.id, productId:insertedProducts[12]!.id, personId:hospitalRows[6]!.id, userId:asmUser!.id, dispatchType:'SALE',   quantity:20,  dispatchDate:daysAgo(12), status:'DELIVERED', totalValue:'6830',  batchNumber:'CP202412', invoiceNumber:'INV-2024-017' },

    // Samples to doctors
    { movementType:'SAMPLE_TO_DOCTOR', fromEntityType:'MR', fromEntityId:mrEmp1!.id, toEntityType:'DOCTOR', toEntityId:doctorRows[0]!.id, productId:insertedProducts[0]!.id,  personId:doctorRows[0]!.id, userId:mrUser1!.id, dispatchType:'SAMPLE', quantity:6,  dispatchDate:daysAgo(14), status:'DELIVERED', totalValue:'0', batchNumber:'CP202400', invoiceNumber:null },
    { movementType:'SAMPLE_TO_DOCTOR', fromEntityType:'MR', fromEntityId:mrEmp1!.id, toEntityType:'DOCTOR', toEntityId:doctorRows[2]!.id, productId:insertedProducts[1]!.id,  personId:doctorRows[2]!.id, userId:mrUser1!.id, dispatchType:'SAMPLE', quantity:2,  dispatchDate:daysAgo(11), status:'DELIVERED', totalValue:'0', batchNumber:'CP202401', invoiceNumber:null },
    { movementType:'SAMPLE_TO_DOCTOR', fromEntityType:'MR', fromEntityId:mrEmp2!.id, toEntityType:'DOCTOR', toEntityId:doctorRows[5]!.id, productId:insertedProducts[3]!.id,  personId:doctorRows[5]!.id, userId:mrUser2!.id, dispatchType:'SAMPLE', quantity:4,  dispatchDate:daysAgo(9),  status:'DELIVERED', totalValue:'0', batchNumber:'CP202403', invoiceNumber:null },
    { movementType:'SAMPLE_TO_DOCTOR', fromEntityType:'MR', fromEntityId:mrEmp3!.id, toEntityType:'DOCTOR', toEntityId:doctorRows[8]!.id, productId:insertedProducts[11]!.id, personId:doctorRows[8]!.id, userId:mrUser3!.id, dispatchType:'SAMPLE', quantity:1,  dispatchDate:daysAgo(7),  status:'DELIVERED', totalValue:'0', batchNumber:'CP202411', invoiceNumber:null },

    // Stockist → Retailer
    { movementType:'STOCKIST_TO_RETAILER', fromEntityType:'STOCKIST', fromEntityId:stockistRows[0]!.id, toEntityType:'RETAILER', toEntityId:null, productId:insertedProducts[0]!.id, personId:stockistRows[0]!.id, userId:mrUser1!.id, dispatchType:'SALE', quantity:25,  dispatchDate:daysAgo(8), status:'DELIVERED', totalValue:'2120',  batchNumber:'CP202400', invoiceNumber:'INV-2024-018', remarks:'Retailer: Shiv Medical Stores'   },
    { movementType:'STOCKIST_TO_RETAILER', fromEntityType:'STOCKIST', fromEntityId:stockistRows[0]!.id, toEntityType:'RETAILER', toEntityId:null, productId:insertedProducts[2]!.id, personId:stockistRows[0]!.id, userId:mrUser1!.id, dispatchType:'SALE', quantity:30,  dispatchDate:daysAgo(6), status:'DELIVERED', totalValue:'2140',  batchNumber:'CP202402', invoiceNumber:'INV-2024-019', remarks:'Retailer: Santosh Pharmacy'      },
    { movementType:'STOCKIST_TO_RETAILER', fromEntityType:'STOCKIST', fromEntityId:stockistRows[2]!.id, toEntityType:'RETAILER', toEntityId:null, productId:insertedProducts[4]!.id, personId:stockistRows[2]!.id, userId:mrUser2!.id, dispatchType:'SALE', quantity:50,  dispatchDate:daysAgo(5), status:'DELIVERED', totalValue:'2200',  batchNumber:'CP202404', invoiceNumber:'INV-2024-020', remarks:'Retailer: Delhi Medical Hall'    },
    { movementType:'STOCKIST_TO_RETAILER', fromEntityType:'STOCKIST', fromEntityId:stockistRows[4]!.id, toEntityType:'RETAILER', toEntityId:null, productId:insertedProducts[11]!.id,personId:stockistRows[4]!.id, userId:mrUser3!.id, dispatchType:'SALE', quantity:10,  dispatchDate:daysAgo(3), status:'DELIVERED', totalValue:'5065',  batchNumber:'CP202411', invoiceNumber:'INV-2024-021', remarks:'Retailer: Bangalore Pharma Mart' },

    // Returns
    { movementType:'RETURN_FROM_STOCKIST', fromEntityType:'STOCKIST', fromEntityId:stockistRows[1]!.id, toEntityType:'COMPANY', toEntityId:null, productId:insertedProducts[1]!.id, personId:stockistRows[1]!.id, userId:mrUser1!.id, dispatchType:'RETURN', quantity:5,  dispatchDate:daysAgo(7),  status:'RETURNED', totalValue:'0',  batchNumber:'CP202401', invoiceNumber:null, remarks:'Damaged packaging'     },
    { movementType:'RETURN_FROM_HOSPITAL', fromEntityType:'HOSPITAL', fromEntityId:hospitalRows[0]!.id, toEntityType:'STOCKIST', toEntityId:stockistRows[0]!.id, productId:insertedProducts[0]!.id, personId:stockistRows[0]!.id, userId:mrUser1!.id, dispatchType:'RETURN', quantity:8, dispatchDate:daysAgo(5), status:'RETURNED', totalValue:'0', batchNumber:'CP202400', invoiceNumber:null, remarks:'Near-expiry stock returned' },
  ];

  for (const row of movementRows) {
    const { movementType, ...rest } = row;
    await db.insert(dispatches).values({ movementType, ...rest });

    const qty = row.quantity;
    const pid = row.productId!;

    if (movementType === 'COMPANY_TO_STOCKIST' && row.toEntityId)
      bump(stockMap, row.toEntityId, pid, qty);

    if (movementType === 'STOCKIST_TO_HOSPITAL' && row.fromEntityId) {
      bump(stockMap, row.fromEntityId, pid, -qty);
      if (row.toEntityId) bump(hospMap, row.toEntityId, pid, qty);
    }

    if (movementType === 'STOCKIST_TO_RETAILER' && row.fromEntityId)
      bump(stockMap, row.fromEntityId, pid, -qty);

    if (movementType === 'COMPANY_TO_HOSPITAL' && row.toEntityId)
      bump(hospMap, row.toEntityId, pid, qty);

    if (movementType === 'RETURN_FROM_STOCKIST' && row.fromEntityId)
      bump(stockMap, row.fromEntityId, pid, -qty);

    if (movementType === 'RETURN_FROM_HOSPITAL') {
      if (row.fromEntityId) bump(hospMap, row.fromEntityId, pid, -qty);
      if (row.toEntityId)   bump(stockMap, row.toEntityId, pid, qty);
    }
  }

  // ── 9. INVENTORY SNAPSHOTS ─────────────────────────────────────────────────
  console.log('📊 Writing inventory snapshots…');

  const today = new Date();

  for (const [personId, pmap] of stockMap) {
    for (const [productId, qty] of pmap) {
      if (qty <= 0) continue;
      await db.insert(stockistInventory).values({ personId, productId, currentQty: qty, lastMovementDate: today });
    }
  }

  for (const [personId, pmap] of hospMap) {
    for (const [productId, qty] of pmap) {
      if (qty <= 0) continue;
      await db.insert(hospitalInventory).values({ personId, productId, currentQty: qty, lastMovementDate: today });
    }
  }

  // ── 10. MONTHLY TARGETS ────────────────────────────────────────────────────
  console.log('🎯 Seeding monthly targets…');

  const now = new Date();
  const targetRows: typeof monthlyTargets.$inferInsert[] = [];

  const targets: Record<string, { target: number; achieved: number }[]> = {
    [mrEmp1!.id]: [
      { target: 600000, achieved: 618000 },
      { target: 550000, achieved: 490000 },
      { target: 500000, achieved: 512000 },
    ],
    [mrEmp2!.id]: [
      { target: 500000, achieved: 388000 },
      { target: 500000, achieved: 456000 },
      { target: 450000, achieved: 430000 },
    ],
    [mrEmp3!.id]: [
      { target: 550000, achieved: 572000 },
      { target: 500000, achieved: 498000 },
      { target: 480000, achieved: 350000 },
    ],
  };

  for (const [empId, months] of Object.entries(targets)) {
    for (let i = 0; i < months.length; i++) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      targetRows.push({
        employeeId:    empId,
        productId:     null,
        month:         dt.getMonth() + 1,
        year:          dt.getFullYear(),
        targetValue:   String(months[i]!.target),
        achievedValue: String(months[i]!.achieved),
      });
    }
  }

  await db.insert(monthlyTargets).values(targetRows);

  // ── 11. ADJUST PRODUCT STOCK ───────────────────────────────────────────────
  for (const prod of insertedProducts) {
    let out = 0;
    let ret = 0;
    for (const row of movementRows) {
      if (row.productId !== prod.id) continue;
      if (['COMPANY_TO_STOCKIST','COMPANY_TO_HOSPITAL','SAMPLE_TO_DOCTOR'].includes(row.movementType)) out += row.quantity;
      if (row.movementType === 'RETURN_FROM_STOCKIST') ret += row.quantity;
    }
    await db.update(products).set({ stockQty: Math.max(0, 5000 - out + ret) }).where(eq(products.id, prod.id));
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log('──────────────────────────────────────');
  console.log('  LOGIN CREDENTIALS');
  console.log('──────────────────────────────────────');
  console.log('  admin@medcrm.com    / Admin@123      (Admin)');
  console.log('  nsm@medcrm.com      / Manager@123    (NSM – Asha Mehta)');
  console.log('  zsm.north@medcrm.com/ Manager@123    (ZSM – Vikram Singh)');
  console.log('  rsm.delhi@medcrm.com/ Manager@123    (RSM – Deepak Malhotra)');
  console.log('  asm.mumbai@medcrm.com/ Manager@123   (ASM – Suresh Gaikwad)');
  console.log('  mr1@medcrm.com      / Mr@123         (MR  – Rahul Verma, Mumbai)');
  console.log('  mr2@medcrm.com      / Mr@123         (MR  – Neha Kapoor, Delhi)');
  console.log('  mr3@medcrm.com      / Mr@123         (MR  – Sanjay Patil, Bengaluru)');
  console.log('──────────────────────────────────────');

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});