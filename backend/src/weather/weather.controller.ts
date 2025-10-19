import { Controller, Get, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { WeatherData, WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  private readonly logger = new Logger(WeatherController.name);

  constructor(private readonly weatherService: WeatherService) {}

  @Get('current')
  async getCurrentWeather(@Query('city') city: string): Promise<WeatherData> {
    this.logger.log(`GET /weather/current - city: ${city}`);
    try {
      const result = await this.weatherService.getCurrentWeather(city);
      this.logger.log(`Response: ${JSON.stringify(result)}`);
      return result;
    } catch (error: any) {
      // Use the status code from the service if available
      const status = error.status || HttpStatus.BAD_REQUEST;
      throw new HttpException(error.message, status);
    }
  }
}
