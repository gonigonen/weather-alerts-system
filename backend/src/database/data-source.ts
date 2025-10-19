import { DataSource } from 'typeorm';
import { Alert } from '../entities/alert.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/weather_alerts?schema=public",
  entities: [Alert],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false, // Disable auto-sync for production
  logging: false,
});
