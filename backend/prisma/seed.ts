import { PrismaClient, Role, Gender, BloodGroup } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Hospital Management System DB Seed...');

  const passwordHash = await bcrypt.hash('Hospital123!', 10);

  // 1. Create Departments
  console.log('Creating Departments...');
  const cardiology = await prisma.department.upsert({
    where: { code: 'CARD-01' },
    update: {},
    create: {
      name: 'Cardiology',
      code: 'CARD-01',
      description: 'Department of Heart and Cardiovascular Health',
    },
  });

  const pediatrics = await prisma.department.upsert({
    where: { code: 'PED-01' },
    update: {},
    create: {
      name: 'Pediatrics',
      code: 'PED-01',
      description: 'Children and Infant Healthcare',
    },
  });

  // 2. Admin User
  console.log('Creating Admin User...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hospital.com' },
    update: {},
    create: {
      email: 'admin@hospital.com',
      passwordHash,
      firstName: 'Chief',
      lastName: 'Administrator',
      role: Role.ADMIN,
      phoneNumber: '+1-555-0100',
      adminProfile: {
        create: {
          department: 'Executive Administration',
          designation: 'Hospital Superintendent',
        },
      },
    },
  });

  // 3. Doctor User
  console.log('Creating Doctor User...');
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor.smith@hospital.com' },
    update: {},
    create: {
      email: 'doctor.smith@hospital.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Smith',
      role: Role.DOCTOR,
      phoneNumber: '+1-555-0101',
      doctorProfile: {
        create: {
          specialization: 'Consultant Cardiologist',
          licenseNumber: 'MD-CARD-9921',
          qualifications: ['MBBS', 'MD Cardiology', 'FACC'],
          consultationFee: 75.0,
          roomNumber: 'Suite 302',
          departmentId: cardiology.id,
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      },
    },
  });

  // 4. Pharmacist User
  console.log('Creating Pharmacist User...');
  const pharmacist = await prisma.user.upsert({
    where: { email: 'pharmacist.alex@hospital.com' },
    update: {},
    create: {
      email: 'pharmacist.alex@hospital.com',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Turner',
      role: Role.PHARMACIST,
      phoneNumber: '+1-555-0102',
      pharmacistProfile: {
        create: {
          licenseNumber: 'RPH-88421',
          pharmacyBlock: 'Ground Floor Central Dispensary',
        },
      },
    },
  });

  // 5. Patient User
  console.log('Creating Patient User...');
  const patient = await prisma.user.upsert({
    where: { email: 'patient.jane@example.com' },
    update: {},
    create: {
      email: 'patient.jane@example.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Doe',
      role: Role.PATIENT,
      phoneNumber: '+1-555-0103',
      patientProfile: {
        create: {
          gender: Gender.FEMALE,
          bloodGroup: BloodGroup.O_POSITIVE,
          address: '42 Baker Street, Metropolis',
          emergencyContactName: 'John Doe',
          emergencyContactPhone: '+1-555-0199',
          allergies: ['Penicillin'],
          chronicDiseases: ['Mild Hypertension'],
        },
      },
    },
  });

  // 6. Pharmacy Inventory
  console.log('Stocking initial pharmacy inventory...');
  await prisma.medicine.upsert({
    where: { name: 'Amoxicillin 500mg' },
    update: {},
    create: {
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      category: 'Capsule',
      manufacturer: 'Pfizer',
      batchNumber: 'AMX-2026-01',
      stockQuantity: 400,
      reorderLevel: 50,
      unitPrice: 0.85,
      expiryDate: new Date('2028-06-30'),
    },
  });

  await prisma.medicine.upsert({
    where: { name: 'Paracetamol 650mg' },
    update: {},
    create: {
      name: 'Paracetamol 650mg',
      genericName: 'Acetaminophen',
      category: 'Tablet',
      manufacturer: 'GSK',
      batchNumber: 'PCM-2026-09',
      stockQuantity: 1200,
      reorderLevel: 100,
      unitPrice: 0.25,
      expiryDate: new Date('2028-12-31'),
    },
  });

  await prisma.medicine.upsert({
    where: { name: 'Atorvastatin 20mg' },
    update: {},
    create: {
      name: 'Atorvastatin 20mg',
      genericName: 'Atorvastatin Calcium',
      category: 'Tablet',
      manufacturer: 'Novartis',
      batchNumber: 'ATV-2026-44',
      stockQuantity: 250,
      reorderLevel: 30,
      unitPrice: 1.2,
      expiryDate: new Date('2027-09-30'),
    },
  });

  console.log('✅ Hospital Management Database seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('Default credentials (password: Hospital123!):');
  console.log('👑 Admin:      admin@hospital.com');
  console.log('🩺 Doctor:     doctor.smith@hospital.com');
  console.log('💊 Pharmacist: pharmacist.alex@hospital.com');
  console.log('🧑 Patient:    patient.jane@example.com');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
