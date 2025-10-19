import { Injectable, Logger } from '@nestjs/common';
import { Alert } from '../entities/alert.entity';

export interface WebhookPayload {
  type: 'alert_triggered' | 'alert_resolved' | 'table_update' | 'batch_triggered';
  alertId?: string;
  city?: string;
  parameter?: string;
  condition?: string;
  threshold?: number;
  currentValue?: number;
  triggeredSince?: string;
  duration?: string;
  message?: string;
  timestamp: string;
  alerts?: any[]; // For batch triggered alerts
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  async sendWebhook(payload: WebhookPayload): Promise<void> {
    // For demo purposes, just log the webhook
    // In a real app, you'd send to a proper webhook endpoint
    this.logger.log(`📡 Webhook: ${payload.type} - ${payload.message}`);
    
    // Could also write to a file that frontend polls
    // Or use Server-Sent Events, or WebSocket
  }

  async sendAlertTriggered(
    alertId: string,
    city: string,
    parameter: string,
    condition: string,
    threshold: number,
    currentValue: number,
    triggeredSince: Date,
    isNew: boolean
  ): Promise<void> {
    const duration = this.calculateDuration(triggeredSince);
    
    const payload: WebhookPayload = {
      type: 'alert_triggered',
      alertId,
      city,
      parameter,
      condition,
      threshold,
      currentValue,
      triggeredSince: triggeredSince.toISOString(),
      duration,
      message: isNew 
        ? `New alert: ${parameter} in ${city} is ${currentValue}`
        : `Ongoing alert: ${parameter} in ${city} is ${currentValue} (${duration})`,
      timestamp: new Date().toISOString()
    };

    await this.sendWebhook(payload);
  }

  async sendTriggeredAlerts(alerts: Alert[]): Promise<void> {
    const alertsData = alerts.map(alert => ({
      id: alert.id,
      city: alert.city,
      parameter: alert.parameter,
      condition: alert.condition,
      threshold: alert.thresholdMin,
      currentValue: alert.currentValue,
      triggeredSince: alert.lastEmailSent?.toISOString(),
      duration: alert.lastEmailSent ? this.calculateDuration(alert.lastEmailSent) : null
    }));

    const payload: WebhookPayload = {
      type: 'batch_triggered',
      alerts: alertsData,
      message: `${alerts.length} alerts currently triggered`,
      timestamp: new Date().toISOString()
    };

    await this.sendWebhook(payload);
  }

  async sendTableUpdate(): Promise<void> {
    const payload: WebhookPayload = {
      type: 'table_update',
      message: 'Alert table needs refresh',
      timestamp: new Date().toISOString()
    };

    await this.sendWebhook(payload);
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
