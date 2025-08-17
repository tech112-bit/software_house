// Script to check admin user status
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking admin user in database...');
    
    // Check all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });
    
    console.log('📊 All users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });
    
    // Check specific admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@softwareco.com' },
    });
    
    if (adminUser) {
      console.log('\n✅ Admin user found:');
      console.log(`  - ID: ${adminUser.id}`);
      console.log(`  - Name: ${adminUser.name}`);
      console.log(`  - Email: ${adminUser.email}`);
      console.log(`  - Role: ${adminUser.role}`);
      console.log(`  - Active: ${adminUser.isActive}`);
      console.log(`  - Created: ${adminUser.createdAt}`);
    } else {
      console.log('\n❌ Admin user not found!');
      console.log('You may need to run: npm run create-admin-user');
    }
    
    // Check if there are any users with ADMIN role
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'admin', 'Administrator', 'administrator']
        }
      }
    });
    
    console.log(`\n🔍 Users with admin roles: ${adminUsers.length}`);
    adminUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
