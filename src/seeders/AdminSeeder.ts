import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Admin } from '../admins/entities/admin.entity';

export class AdminSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPhone = process.env.ADMIN_PHONE || '+2348000000000';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'App';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'Administrator';

    if (!adminEmail || !adminPassword) {
      console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file');
      return;
    }

    // Check if admin already exists
    const existingAdmin = await em.findOne(Admin, {
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log('Admin user already exists, skipping...');
      return;
    }

    // Create admin user
    const admin = em.create(Admin, {
      email: adminEmail,
      firstName: adminFirstName,
      lastName: adminLastName,
      phoneNumber: adminPhone,
      password: adminPassword,
      mustChangePassword: true,
    });

    await em.persistAndFlush(admin);
    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${adminEmail}`);
    console.log('⚠️  Remember to change this password after first login!');
  }
}
