import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '../config/config.service';

export interface EmailAlertData {
  email: string;
  city: string;
  parameter: string;
  condition: string;
  threshold: number;
  currentValue: number;
}

@Injectable()
export class EmailClient {
  private readonly logger = new Logger(EmailClient.name);

  constructor(private configService: ConfigService) {
    this.initializeSendGrid();
  }

  private initializeSendGrid() {
    const apiKey = this.configService.sendGridApiKey;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.logger.log('📧 SendGrid email client initialized');
    } else {
      this.logger.warn('⚠️ SENDGRID_API_KEY not found - emails will not be sent');
    }
  }

  async sendAlertEmail(alertData: EmailAlertData): Promise<void> {
    if (!this.configService.sendGridApiKey) {
      this.logger.warn('📧 Email not sent - SendGrid API key missing');
      return;
    }

    try {
      const msg = {
        to: alertData.email,
        from: this.configService.fromEmail,
        subject: `🚨 Weather Alert - ${alertData.city}`,
        html: this.buildEmailTemplate(alertData)
      };

      await sgMail.send(msg);
      this.logger.log(`📧 Alert email sent to ${alertData.email} via SendGrid`);
    } catch (error) {
      this.logger.error(`❌ SendGrid email failed:`, error.message);
    }
  }

  private buildEmailTemplate(data: EmailAlertData): string {
    const units = {
      temperature: '°C',
      windSpeed: ' m/s',
      humidity: '%',
      precipitationProbability: '%'
    };

    const unit = units[data.parameter] || '';

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff4d4f; color: white; padding: 20px; text-align: center;">
          <h1>🚨 Weather Alert Triggered</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <h2>Alert Details</h2>
          <div style="background: #fff2f0; border: 1px solid #ffccc7; padding: 20px; border-radius: 6px;">
            <p><strong>Location:</strong> ${data.city}</p>
            <p><strong>Parameter:</strong> ${data.parameter}</p>
            <p><strong>Condition:</strong> ${data.condition} ${data.threshold}${unit}</p>
            <p><strong>Current Value:</strong> <span style="font-size: 24px; color: #ff4d4f; font-weight: bold;">${data.currentValue}${unit}</span></p>
          </div>
        </div>
        <div style="background: #fafafa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          Weather Alerts System | Powered by Tomorrow.io
        </div>
      </div>
    `;
  }
}
