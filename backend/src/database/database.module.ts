import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from '../entities/alert.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Alert],
      synchronize: false, // Use migrations instead
      logging: false,
    }),
    TypeOrmModule.forFeature([Alert]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
