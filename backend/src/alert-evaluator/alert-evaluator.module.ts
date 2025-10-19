import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertEvaluatorService } from './alert-evaluator.service';
import { Alert } from '../entities/alert.entity';
import { WeatherModule } from '../weather/weather.module';
import { EmailClient } from '../clients/email.client';
import { WebhookService } from '../notifications/webhook.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert]),
    WeatherModule,
    ConfigModule,
  ],
  providers: [AlertEvaluatorService, EmailClient, WebhookService],
  exports: [AlertEvaluatorService],
})
export class AlertEvaluatorModule {}
