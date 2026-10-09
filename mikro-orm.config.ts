import { defineConfig } from '@mikro-orm/postgresql';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  clientUrl: process.env.DATABASE_URL, // full URL with sslmode=require
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
  seeder: {
    path: 'dist/seeders',
    pathTs: 'src/seeders',
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
    emit: 'ts',
  },
  pool: { min: 1, max: 5 },
  driverOptions: {
    connection: {
      ssl: { rejectUnauthorized: false }, // sometimes needed for self-signed certs
    },
  },
});
