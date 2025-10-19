import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum WeatherParameter {
  TEMPERATURE = 'temperature',
  TEMPERATURE_APPARENT = 'temperatureApparent',
  WIND_SPEED = 'windSpeed',
  WIND_GUST = 'windGust',
  WIND_DIRECTION = 'windDirection',
  HUMIDITY = 'humidity',
  PRECIPITATION_PROBABILITY = 'precipitationProbability',
  RAIN_INTENSITY = 'rainIntensity',
  SNOW_INTENSITY = 'snowIntensity',
  SLEET_INTENSITY = 'sleetIntensity',
  FREEZING_RAIN_INTENSITY = 'freezingRainIntensity',
  HAIL_PROBABILITY = 'hailProbability',
  HAIL_SIZE = 'hailSize',
  PRESSURE_SEA_LEVEL = 'pressureSeaLevel',
  PRESSURE_SURFACE_LEVEL = 'pressureSurfaceLevel',
  DEW_POINT = 'dewPoint',
  CLOUD_COVER = 'cloudCover',
  CLOUD_BASE = 'cloudBase',
  CLOUD_CEILING = 'cloudCeiling',
  VISIBILITY = 'visibility',
  UV_INDEX = 'uvIndex',
  UV_HEALTH_CONCERN = 'uvHealthConcern',
  WEATHER_CODE = 'weatherCode'
}

export enum AlertCondition {
  ABOVE = 'above',
  ABOVE_EQUAL = 'above_equal',
  EQUAL = 'equal',
  BELOW_EQUAL = 'below_equal',
  BELOW = 'below',
  BETWEEN = 'between'
}

@Entity('alerts')
@Index(['city', 'parameter'])
@Index(['isActive'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  city: string;

  @Column({
    type: 'enum',
    enum: WeatherParameter
  })
  parameter: WeatherParameter;

  @Column({
    type: 'enum',
    enum: AlertCondition
  })
  condition: AlertCondition;

  @Column('decimal', { precision: 10, scale: 2, name: 'threshold_min' })
  thresholdMin: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, name: 'threshold_max' })
  thresholdMax?: number;

  @Column({ nullable: true })
  email?: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Simplified state tracking
  @Column({ type: 'timestamp', nullable: true, name: 'last_email_sent' })
  lastEmailSent?: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, name: 'current_value' })
  currentValue?: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_checked' })
  lastChecked?: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'next_trigger_forecast' })
  nextTriggerForecast?: any;
}
