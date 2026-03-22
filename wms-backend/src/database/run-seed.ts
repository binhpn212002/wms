import 'reflect-metadata';
import { config as loadDotenv } from 'dotenv';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { seedRolesAndPermissions } from './seeds/roles-permissions.seed';
import { seedUsers } from './seeds/users.seed';

/** Luôn đọc `wms-backend/.env` theo vị trí file (không phụ thuộc cwd). */
loadDotenv({ path: join(__dirname, '../../.env') });

/**
 * Chạy seed roles/permissions + users (không mở HTTP).
 * Dùng: npm run seed
 */
async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const dataSource = app.get(DataSource);
    await seedRolesAndPermissions(dataSource);
    await seedUsers(dataSource);
    console.log('[seed] Hoàn tất.');
  } finally {
    await app.close();
  }
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
