import { Injectable, Logger } from '@nestjs/common';
import { TomorrowClient } from '../clients/tomorrow.client';

export interface WeatherData {
  city: string;
  temperature: number;
  windSpeed: number;
  humidity: number;
  precipitationProbability: number;
}

interface ForecastHour {
  datetime: string;
  temperature: number;
  windSpeed: number;
  humidity: number;
  precipitationProbability: number;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  
  // Cache only for current weather (5 minutes)
  private currentWeatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
  private readonly CURRENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private tomorrowClient: TomorrowClient) {}

  async getCurrentWeather(city: string): Promise<WeatherData> {
    const cacheKey = city.toLowerCase();
    const cached = this.currentWeatherCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CURRENT_CACHE_TTL) {
      this.logger.debug(`📦 Using cached current weather for ${city}`);
      return cached.data;
    }

    try {
      this.logger.log(`🌤️ Fetching current weather for ${city}`);
      
      const response = await this.tomorrowClient.getCurrentWeather(city);
      
      const weatherData: WeatherData = {
        temperature: response.data.values.temperature,
        windSpeed: response.data.values.windSpeed,
        humidity: response.data.values.humidity,
        precipitationProbability: response.data.values.precipitationProbability,
        city: city
      };

      // Cache the result
      this.currentWeatherCache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      return weatherData;
    } catch (error) {
      this.logger.error(`Failed to get current weather for ${city}:`, error);
      throw error;
    }
  }

  async getForecast(city: string): Promise<ForecastHour[]> {
    try {
      this.logger.log(`🔮 Fetching fresh 3-day forecast for ${city}`);
      
      const response = await this.tomorrowClient.getTimelineForecast(city, undefined, '1h');
      
      // Process forecast data (next 72 hours = 3 days)
      const forecast: ForecastHour[] = response.data.timelines[0].intervals
        .map((interval) => ({
          datetime: interval.startTime,
          temperature: interval.values.temperature,
          windSpeed: interval.values.windSpeed,
          humidity: interval.values.humidity,
          precipitationProbability: interval.values.precipitationProbability
        }));

      return forecast;
    } catch (error) {
      this.logger.error(`Failed to get forecast for ${city}:`, error);
      throw error;
    }
  }

  // Clear expired cache entries (only for current weather)
  clearExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, value] of this.currentWeatherCache.entries()) {
      if (now - value.timestamp > this.CURRENT_CACHE_TTL) {
        this.currentWeatherCache.delete(key);
      }
    }
  }
}
