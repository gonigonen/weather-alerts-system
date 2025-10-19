import { IsString, IsEnum, IsNumber, IsOptional, IsEmail, ValidateIf, Min, Max } from 'class-validator';
import { WeatherParameter, AlertCondition } from '../../entities/alert.entity';

export class CreateAlertDto {
  @IsString()
  city: string;

  @IsEnum(WeatherParameter)
  parameter: WeatherParameter;

  @IsEnum(AlertCondition)
  condition: AlertCondition;

  @IsNumber()
  @ValidateIf(o => !['weatherCode'].includes(o.parameter))
  thresholdMin: number;

  @ValidateIf(o => o.condition === AlertCondition.BETWEEN)
  @IsNumber()
  thresholdMax?: number;

  @IsOptional()
  @IsEmail()
  email?: string;
}
