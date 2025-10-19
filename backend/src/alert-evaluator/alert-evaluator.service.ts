import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertCondition } from '../entities/alert.entity';
import { WeatherService } from '../weather/weather.service';

interface ForecastTrigger {
  date: string;
  value: number;
}

type ForecastTriggerResult = ForecastTrigger[] | null;
import { EmailClient } from '../clients/email.client';
import { WebhookService } from '../notifications/webhook.service';

@Injectable()
export class AlertEvaluatorService {
  private readonly logger = new Logger(AlertEvaluatorService.name);

  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    private weatherService: WeatherService,
    private emailService: EmailClient,
    private webhookService: WebhookService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async evaluateAllAlerts(): Promise<void> {
    this.logger.log('🔄 Starting hourly alert evaluation...');
    
    try {
      const alerts = await this.alertRepository.find({ 
        where: { isActive: true }
      });

      if (alerts.length === 0) {
        this.logger.log('📭 No active alerts to evaluate');
        return;
      }

      this.logger.log(`📊 Evaluating ${alerts.length} active alerts`);

      const cities = [...new Set(alerts.map(alert => alert.city))];
      
      // Fetch all weather data in parallel
      const weatherPromises = cities.map(city => 
        this.weatherService.getForecast(city)
          .then(forecast => ({ city, forecast }))
          .catch(error => {
            this.logger.warn(`⚠️ Failed to get forecast for ${city}: ${error.message}`);
            return { city, forecast: null };
          })
      );
      
      const weatherResults = await Promise.all(weatherPromises);
      const weatherMap = new Map(
        weatherResults
          .filter(result => result.forecast && result.forecast.length > 0)
          .map(result => [result.city, result.forecast])
      );

      // Evaluate all alerts in parallel
      const evaluationPromises = alerts
        .filter(alert => weatherMap.has(alert.city))
        .map(async (alert) => {
          const forecast = weatherMap.get(alert.city);
          const currentWeather = forecast[0];
          return await this.evaluateAlert(alert, currentWeather, forecast);
        });

      const evaluationResults = await Promise.all(evaluationPromises);
      const triggeredAlerts = alerts.filter((_, index) => evaluationResults[index]);

      // Send single webhook notification for all triggered alerts
      if (triggeredAlerts.length > 0) {
        this.logger.log(`🚨 Sending single webhook for ${triggeredAlerts.length} triggered alerts`);
        await this.webhookService.sendTriggeredAlerts(triggeredAlerts);
      }
      
      this.logger.log('✅ Alert evaluation completed');
    } catch (error) {
      this.logger.error('❌ Alert evaluation failed:', error);
    }
  }

  private async evaluateAlert(alert: Alert, currentWeather: any, forecast: any[]): Promise<boolean> {
    const currentValue = currentWeather[alert.parameter];
    const isTriggered = this.checkCondition(alert, currentValue);
    const now = new Date();

    // Find next trigger in forecast
    const nextTrigger = this.findNextTriggerInForecast(alert, forecast);

    // Update current value, last checked, and forecast
    alert.currentValue = currentValue;
    alert.lastChecked = now;
    alert.nextTriggerForecast = nextTrigger;

    if (isTriggered) {
      // Check if we should send notifications (email & webhook)
      const shouldSendNotifications = this.shouldSendNotifications(alert);
      
      if (shouldSendNotifications) {
        this.logger.log(`🚨 NEW ALERT TRIGGERED: ${alert.parameter} in ${alert.city} is ${currentValue}`);
        
        alert.lastEmailSent = now;

        // Send email notification
        if (alert.email) {
          await this.emailService.sendAlertEmail({
            email: alert.email,
            city: alert.city,
            parameter: alert.parameter,
            condition: alert.condition,
            threshold: alert.thresholdMin,
            currentValue
          });
        }
      } else {
        // Ongoing trigger - just log
        this.logger.log(`🔄 ONGOING ALERT: ${alert.parameter} in ${alert.city} is ${currentValue}`);
      }
    } else {
      // Alert not triggered - reset lastEmailSent if it was previously triggered
      if (alert.lastEmailSent) {
        this.logger.log(`✅ ALERT RESOLVED: ${alert.parameter} in ${alert.city} is ${currentValue}`);
        alert.lastEmailSent = null;
      }
    }

    await this.alertRepository.save(alert);
    
    return isTriggered && this.shouldSendNotifications(alert);
  }

  private shouldSendNotifications(alert: Alert): boolean {
    if (!alert.lastEmailSent) {
      return true; // First time triggering
    }
    
    // Send notifications again after 5 hours of continuous triggering
    const hoursSinceLastNotification = (Date.now() - alert.lastEmailSent.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastNotification >= 5;
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

  private findNextTriggerInForecast(alert: Alert, forecast: any[]): ForecastTriggerResult {
    const triggers: ForecastTrigger[] = [];
    
    for (const hour of forecast) {
      const value = hour[alert.parameter];
      if (this.checkCondition(alert, value)) {
        triggers.push({
          date: hour.datetime,
          value
        });
      }
    }
    
    return triggers.length > 0 ? triggers : null;
  }
}
