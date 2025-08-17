// Script to create an admin user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@softwareco.com' },
    });

    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@softwareco.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('Admin user created:', user);
    console.log('Email: admin@softwareco.com');
    console.log('Password: admin123');
    console.log('Role: ADMIN');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();