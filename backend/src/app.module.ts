import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WeatherModule } from './weather/weather.module';
import { AlertsModule } from './alerts/alerts.module';
import { AlertEvaluatorModule } from './alert-evaluator/alert-evaluator.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
    WeatherModule, 
    AlertsModule,
    AlertEvaluatorModule,
  ],
})
export class AppModule {}
