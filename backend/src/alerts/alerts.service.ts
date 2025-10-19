import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertCondition, WeatherParameter } from '../entities/alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {}

  async create(createAlertDto: CreateAlertDto): Promise<Alert> {
    // Validate alert data
    this.validateAlertData(createAlertDto);

    try {
      const alert = this.alertRepository.create({
        city: createAlertDto.city,
        parameter: createAlertDto.parameter,
        condition: createAlertDto.condition,
        thresholdMin: createAlertDto.thresholdMin,
        thresholdMax: createAlertDto.thresholdMax,
        email: createAlertDto.email,
      });

      return await this.alertRepository.save(alert);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new BadRequestException('An alert with these exact conditions already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<any[]> {
    const alerts = await this.alertRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    // Calculate status from current values
    return alerts.map(alert => {
      const isTriggered = alert.currentValue !== null ? 
        this.checkCondition(alert, alert.currentValue) : false;
      
      return {
        ...alert,
        status: isTriggered ? 'triggered' : 'normal',
        lastChecked: alert.lastChecked,
        currentValue: alert.currentValue,
        nextTriggers: (() => {
          const triggers = this.extractNextTriggers(alert.nextTriggerForecast);
          console.log(`🎯 Alert ${alert.id} nextTriggers:`, triggers);
          return triggers;
        })(),
        duration: isTriggered && alert.lastEmailSent ? 
          this.calculateDuration(alert.lastEmailSent) : null,
      };
    });
  }

  async findOne(id: string): Promise<any> {
    const alert = await this.alertRepository.findOne({
      where: { id, isActive: true },
    });

    if (!alert) {
      throw new BadRequestException('Alert not found');
    }

    const isTriggered = alert.currentValue !== null ? 
      this.checkCondition(alert, alert.currentValue) : false;

    return {
      ...alert,
      status: isTriggered ? 'triggered' : 'normal',
      lastChecked: alert.lastChecked,
      currentValue: alert.currentValue,
      nextTriggers: (() => {
        const triggers = this.extractNextTriggers(alert.nextTriggerForecast);
        console.log(`🎯 Alert ${alert.id} nextTriggers:`, triggers);
        return triggers;
      })(),
      duration: isTriggered && alert.lastEmailSent ? 
        this.calculateDuration(alert.lastEmailSent) : null,
    };
  }

  async remove(id: string): Promise<void> {
    const alert = await this.alertRepository.findOne({
      where: { id, isActive: true },
    });

    if (!alert) {
      throw new BadRequestException('Alert not found');
    }

    // Soft delete by setting isActive to false
    alert.isActive = false;
    await this.alertRepository.save(alert);
  }

  private validateAlertData(data: CreateAlertDto): void {
    if (data.condition === AlertCondition.BETWEEN) {
      if (!data.thresholdMax || data.thresholdMin >= data.thresholdMax) {
        throw new BadRequestException('For "between" condition, thresholdMax must be greater than thresholdMin');
      }
    }

    // Validate parameter-specific ranges
    switch (data.parameter) {
      case WeatherParameter.TEMPERATURE:
        if (data.thresholdMin < -50 || data.thresholdMin > 60) {
          throw new BadRequestException('Temperature threshold must be between -50°C and 60°C');
        }
        break;
      case WeatherParameter.HUMIDITY:
        if (data.thresholdMin < 0 || data.thresholdMin > 100) {
          throw new BadRequestException('Humidity threshold must be between 0% and 100%');
        }
        break;
      case WeatherParameter.PRECIPITATION_PROBABILITY:
        if (data.thresholdMin < 0 || data.thresholdMin > 100) {
          throw new BadRequestException('Precipitation probability must be between 0% and 100%');
        }
        break;
      case WeatherParameter.WIND_SPEED:
        if (data.thresholdMin < 0 || data.thresholdMin > 200) {
          throw new BadRequestException('Wind speed threshold must be between 0 and 200 m/s');
        }
        break;
    }
  }

  private extractNextTriggers(forecastData: any): any[] {
    if (!forecastData) {
      console.log('❌ No forecast data');
      return [];
    }
    
    const now = new Date();
    
    // Extract next trigger predictions from forecast and calculate hoursFromNow dynamically
    if (Array.isArray(forecastData)) {
      const result = forecastData.map(trigger => ({
        ...trigger,
        hoursFromNow: Math.round((new Date(trigger.date).getTime() - now.getTime()) / (1000 * 60 * 60))
      }));
      console.log('✅ Extracted triggers with dynamic hoursFromNow:', result);
      return result;
    }
    
    const result = forecastData ? [{
      ...forecastData,
      hoursFromNow: Math.round((new Date(forecastData.date).getTime() - now.getTime()) / (1000 * 60 * 60))
    }] : [];
    console.log('✅ Single trigger converted to array with dynamic hoursFromNow:', result);
    return result;
  }

  private checkCondition(alert: Alert, currentValue: number): boolean {
    switch (alert.condition) {
      case AlertCondition.ABOVE:
        return currentValue > alert.thresholdMin;
      case AlertCondition.ABOVE_EQUAL:
        return currentValue >= alert.thresholdMin;
      case AlertCondition.EQUAL:
        return Math.abs(currentValue - alert.thresholdMin) < 0.01;
      case AlertCondition.BELOW_EQUAL:
        return currentValue <= alert.thresholdMin;
      case AlertCondition.BELOW:
        return currentValue < alert.thresholdMin;
      case AlertCondition.BETWEEN:
        return currentValue >= alert.thresholdMin && currentValue <= alert.thresholdMax;
      default:
        return false;
    }
  }

  private calculateDuration(since: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - since.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  }
}
