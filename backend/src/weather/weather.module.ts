import { Module } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { TomorrowClient } from '../clients/tomorrow.client';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [WeatherController],
  providers: [WeatherService, TomorrowClient],
  exports: [WeatherService],
})
export class WeatherModule {}
