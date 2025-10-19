import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAlertsTable1729340000000 implements MigrationInterface {
  name = 'CreateAlertsTable1729340000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create weather parameter enum
    await queryRunner.query(`
      CREATE TYPE "weather_parameter_enum" AS ENUM (
        'temperature',
        'temperatureApparent',
        'windSpeed',
        'windGust',
        'windDirection',
        'humidity',
        'precipitationProbability',
        'rainIntensity',
        'snowIntensity',
        'sleetIntensity',
        'freezingRainIntensity',
        'hailProbability',
        'hailSize',
        'pressureSeaLevel',
        'pressureSurfaceLevel',
        'dewPoint',
        'cloudCover',
        'cloudBase',
        'cloudCeiling',
        'visibility',
        'uvIndex',
        'uvHealthConcern',
        'weatherCode'
      )
    `);

    // Create alert condition enum
    await queryRunner.query(`
      CREATE TYPE "alert_condition_enum" AS ENUM (
        'above', 
        'above_equal', 
        'equal', 
        'below_equal', 
        'below', 
        'between'
      )
    `);

    // Create alerts table (simplified)
    await queryRunner.query(`
      CREATE TABLE "alerts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "city" character varying(100) NOT NULL,
        "parameter" "weather_parameter_enum" NOT NULL,
        "condition" "alert_condition_enum" NOT NULL,
        "threshold_min" decimal(10,2) NOT NULL,
        "threshold_max" decimal(10,2),
        "email" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "last_email_sent" TIMESTAMP,
        "current_value" decimal(10,2),
        "last_checked" TIMESTAMP,
        "next_trigger_forecast" jsonb,
        CONSTRAINT "PK_alerts" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_alerts_city_parameter" ON "alerts" ("city", "parameter")
    `);
    
    await queryRunner.query(`
      CREATE INDEX "IDX_alerts_is_active" ON "alerts" ("is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_alerts_is_active"`);
    await queryRunner.query(`DROP INDEX "IDX_alerts_city_parameter"`);
    await queryRunner.query(`DROP TABLE "alerts"`);
    await queryRunner.query(`DROP TYPE "alert_condition_enum"`);
    await queryRunner.query(`DROP TYPE "weather_parameter_enum"`);
  }
}
