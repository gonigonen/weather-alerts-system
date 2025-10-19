import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/weather_alerts?schema=public',
});

async function addWeatherParameters() {
  try {
    console.log('🔄 Connecting to database...');
    await dataSource.initialize();

    console.log('📊 Adding new weather parameters to enum...');
    
    // Add new enum values
    await dataSource.query(`
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'temperatureApparent';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'windGust';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'windDirection';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'rainIntensity';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'snowIntensity';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'sleetIntensity';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'freezingRainIntensity';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'hailProbability';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'hailSize';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'pressureSeaLevel';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'pressureSurfaceLevel';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'dewPoint';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'cloudCover';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'cloudBase';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'cloudCeiling';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'visibility';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'uvIndex';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'uvHealthConcern';
      ALTER TYPE weather_parameter_enum ADD VALUE IF NOT EXISTS 'weatherCode';
    `);

    console.log('✅ Successfully added new weather parameters to enum');
    
  } catch (error) {
    console.error('❌ Error adding weather parameters:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

addWeatherParameters().catch(console.error);
