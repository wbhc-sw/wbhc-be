import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '../types/investor';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const username = process.argv[2] || 'admin';
    const email = process.argv[3] || 'admin@company.com';
    const password = process.argv[4] || 'admin123';
    
    console.log(`Creating admin user with:`);
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      console.error('❌ User with this username or email already exists');
      return;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create admin user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        isActive: true
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log(`User ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
