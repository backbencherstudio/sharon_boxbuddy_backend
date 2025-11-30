import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminEmail = 'admin@colisr.com';
  const adminPassword = 'AdminPassword123!'; // Change this to a secure password

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      username: 'sharon',
      name: 'Admin User',
      first_name: 'Admin',
      last_name: 'User',
      status: 1,
      type: 'admin',
      email_verified_at: new Date(),
    },
  });

  console.log('Admin user created successfully:', adminUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
