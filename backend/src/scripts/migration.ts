import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../database/data-source';

async function runMigrations() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    
    console.log('📊 Running pending migrations...');
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('✅ No pending migrations found');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migrations:`);
      migrations.forEach(migration => {
        console.log(`  - ${migration.name}`);
      });
    }

    // Add new weather parameters to enum after migrations
    console.log('📊 Adding new weather parameters to enum...');
    await AppDataSource.query(`
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
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

async function revertMigration() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    
    console.log('⏪ Reverting last migration...');
    await AppDataSource.undoLastMigration();
    console.log('✅ Successfully reverted last migration');
    
  } catch (error) {
    console.error('❌ Migration revert failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'revert') {
  revertMigration();
} else {
  runMigrations();
}
