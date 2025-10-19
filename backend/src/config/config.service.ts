import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  constructor() {
    this.validateConfig();
  }

  private validateConfig(): void {
    const required = ['TOMORROW_IO_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  get tomorrowIoApiKey(): string {
    return process.env.TOMORROW_IO_API_KEY!;
  }

  get sendGridApiKey(): string | undefined {
    return process.env.SENDGRID_API_KEY;
  }

  get fromEmail(): string {
    return process.env.FROM_EMAIL || 'alerts@weather-system.com';
  }
}
