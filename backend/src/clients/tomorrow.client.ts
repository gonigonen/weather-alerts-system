import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { ConfigService } from '../config/config.service';

export interface TomorrowRealtimeResponse {
  data: {
    values: {
      temperature: number;
      windSpeed: number;
      humidity: number;
      precipitationProbability: number;
    };
  };
}

export interface TomorrowTimelineForecastResponse {
  data: {
    timelines: [{
      timestep: '1m' | '1h' | '1d';
      intervals: Array<{
        startTime: string;
        values: Record<string, number>;
      }>
    }];
  };
}

@Injectable()
export class TomorrowClient {
  private readonly logger = new Logger(TomorrowClient.name);
  private readonly baseUrl = 'https://api.tomorrow.io/v4';

  constructor(private configService: ConfigService) {}

  async getCurrentWeather(location: string): Promise<TomorrowRealtimeResponse> {
    try {
      this.logger.debug(`🌤️ Tomorrow.io API: Fetching current weather for ${location}`);
      
      const response: AxiosResponse<TomorrowRealtimeResponse> = await axios.get(
        `${this.baseUrl}/weather/realtime`,
        {
          params: {
            location,
            apikey: this.configService.tomorrowIoApiKey,
            fields: 'temperature,windSpeed,humidity,precipitationProbability'
          }
        }
      );

      return response.data;
    } catch (error) {
      this.handleApiError(error, `current weather for ${location}`);
    }
  }

  async getTimelineForecast(location: string, requiredParameters?: string[], interval: '1m' | '1h' | '1d' = '1m'): Promise<TomorrowTimelineForecastResponse> {
    try {
      this.logger.debug(`🔮 Tomorrow.io API: Fetching timeline forecast for ${location}`);
      
      // Build fields string based on required parameters
      let fields = 'temperature,windSpeed,humidity,precipitationProbability'; // Default all fields
      if (requiredParameters && requiredParameters.length > 0) {
        fields = requiredParameters.join(',');
        this.logger.debug(`📊 Optimized API call with fields: ${fields}`);
      }
      
      const response: AxiosResponse<TomorrowTimelineForecastResponse> = await axios.get(
        `${this.baseUrl}/timelines`,
        {
          params: {
            location,
            apikey: this.configService.tomorrowIoApiKey,
            endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days later
            fields,
            timesteps: interval,
            units: 'metric'
          }
        }
      );

      return response.data;
    } catch (error) {
      this.handleApiError(error, `hourly forecast for ${location}`);
    }
  }

  private handleApiError(error: any, operation: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      this.logger.error(`Tomorrow.io API Error - Operation: ${operation}, Status: ${status}, Message: ${message}`);
      
      const customError = new Error(`Tomorrow.io API failed for ${operation}: ${message}`);
      (customError as any).status = status;
      throw customError;
    }
    
    this.logger.error(`Unexpected error during ${operation}:`, error);
    throw new Error(`Tomorrow.io API failed for ${operation}`);
  }
}
