# Weather Alerts System

A comprehensive weather alert system with real-time monitoring, conflict resolution, and forecast analysis.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐
│   Frontend      │    │   Backend API    │
│   (React)       │◄──►│   (NestJS)       │
│                 │    │                  │
│ - Create alerts │    │ - CRUD alerts    │
│ - View alerts   │    │ - Conflict mgmt  │
│ - Manage alerts │    │ - Serve data     │
│ - Weather UI    │    │ - Validation     │
│                 │    │ - Alert eval     │
│                 │    │ - Notifications  │
└─────────────────┘    └──────────────────┘
                                │
                                │
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │                 │
                       │ - Alerts        │
                       │ - Evaluations   │
                       └─────────────────┘
```

## Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Docker & Docker Compose** - [Download](https://www.docker.com/products/docker-desktop/)
- **npm** (comes with Node.js)

### Required API Keys
- **Tomorrow.io API Key** - [Get Free Key](https://www.tomorrow.io/weather-api/)
  - Sign up for free account
  - Get API key from dashboard
  - Free tier: 1000 calls/day (sufficient for testing)

## Important Assumptions

### 🌍 **City Name Resolution**
- **Major Cities Only**: System assumes alerts are created for major world cities
- **Default Country**: When ambiguous city names are provided:
  - `Paris` → `Paris, France` (not Paris, Texas)
  - `London` → `London, UK` (not London, Ontario)
  - `Milan` → `Milan, Italy` (not Milan, Michigan)
- **Weather API Behavior**: Tomorrow.io API automatically resolves to the most prominent city with that name

### ⚡ **Alert Evaluation**
- **Evaluation Frequency**: Every 1 hour
- **Parameter Coverage**: 23 weather parameters supported
- **Forecast Range**: 3-day forecast predictions
- **Data Source**: Tomorrow.io weather API (reliable, global coverage)
- **Trigger Logic**: Alerts trigger when current conditions meet thresholds
- **UI Notifications**: All triggered alerts are always displayed in the UI
- **Email/Webhook Notifications**: Only sent for alerts that haven't been triggered in the past 5 hours (prevents spam)

## Quick Start

### 1. Clone and Install
```bash
# Clone repository
git clone <repository-url>
cd weather-alerts-system

# Install all dependencies
npm run install:all
```

### 2. Environment Setup
Create environment files with your API keys:

**Backend (.env)**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/weather_alerts?schema=public"
TOMORROW_IO_API_KEY=your_tomorrow_io_api_key_here
FROM_EMAIL=your_sender_email@example.com
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:3001
```

### 3. Database Setup
```bash
# Start PostgreSQL database
docker-compose up -d postgres

# Wait for database to be ready (30 seconds)
sleep 30

# Run database migrations (REQUIRED)
cd backend && npm run migration && cd ..
```

> ⚠️ **Critical**: Database migrations MUST be run before starting the backend. This creates all required tables and enums.

### 4. Start services individually
```bash
# Terminal 1: Backend + Alert Evaluator
cd backend && npm run start:dev

# Terminal 2: Frontend
cd frontend && npm start
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database Admin**: http://localhost:8080 (pgAdmin)

## Features

### Core Features
- **Interactive Map**: Click on city names or search to select locations
- **Real-time Weather**: Current temperature, wind speed, humidity, and rain chance
- **Advanced Alert Conditions**: 
  - Above (`>`)
  - Above or Equal (`>=`)
  - Equal (`=`)
  - Below or Equal (`<=`)
  - Below (`<`)
  - Between (range)
- **Conflict Resolution**: Automatic detection and handling of conflicting alerts
- **3-Day Forecast**: Predictive alert triggering for upcoming weather
- **Browser Notifications**: Floating alert banners when conditions are met

### Weather Parameters (23 Total)

| Category | Parameters | Units | Range |
|----------|------------|-------|-------|
| **Temperature** | temperature, temperatureApparent, dewPoint | °C | -50 to 60 |
| **Wind** | windSpeed, windGust | m/s | 0 to 200 |
| **Wind Direction** | windDirection | degrees | 0 to 360 |
| **Humidity & Rain** | humidity, precipitationProbability | % | 0 to 100 |
| **Precipitation** | rainIntensity, snowIntensity, sleetIntensity, freezingRainIntensity | mm/h | 0 to 100 |
| **Severe Weather** | hailProbability, hailSize | %, mm | 0 to 100 |
| **Atmospheric** | pressureSeaLevel, pressureSurfaceLevel | hPa | 800 to 1200 |
| **Clouds** | cloudCover, cloudBase, cloudCeiling | %, km | 0 to 100, 0 to 20 |
| **Visibility** | visibility | km | 0 to 50 |
| **UV** | uvIndex, uvHealthConcern | index | 0 to 15, 0 to 10 |
| **Weather Code** | weatherCode | code | 0 to 9999 |

### Alert Conditions

| Condition | Symbol | Description | Example |
|-----------|--------|-------------|---------|
| Above | `>` | Trigger when value exceeds threshold | Temperature > 30°C |
| Above Equal | `>=` | Trigger when value meets or exceeds | Humidity >= 80% |
| Equal | `=` | Trigger when value exactly matches | Wind Speed = 15 m/s |
| Below Equal | `<=` | Trigger when value is at or below | Temperature <= 5°C |
| Below | `<` | Trigger when value is below threshold | Rain Chance < 10% |
| Between | `between` | Trigger when value is within range | Temperature between 20°C - 25°C |

## Development Commands

### Package Management
```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Install backend only
cd backend && npm install

# Install frontend only
cd frontend && npm install
```

### Database Operations
```bash
# Start database only
docker-compose up -d postgres

# Run migrations (create/update tables)
cd backend && npm run migration

# Revert last migration
cd backend && npm run migration revert

# Reset database (WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d postgres
cd backend && npm run migration
```

### Development Servers
```bash
# Start all services
npm run dev:all

# Backend only (includes alert evaluator)
cd backend && npm run start:dev

# Frontend only
cd frontend && npm start

# Frontend build
cd frontend && npm run build
```

## Database Access

### pgAdmin Web Interface
```bash
# Start pgAdmin
docker-compose up -d pgadmin
```

**Access pgAdmin:**
- URL: http://localhost:8080
- Email: `admin@weather-alerts.com`
- Password: `admin123`

**Database Connection in pgAdmin:**
1. Click "Add New Server"
2. **General Tab:** Name: `Weather Alerts DB`
3. **Connection Tab:**
   - Host: `postgres`
   - Port: `5432`
   - Database: `weather_alerts`
   - Username: `postgres`
   - Password: `password`

### Direct Database Access
```bash
# Using psql
psql postgresql://postgres:password@localhost:5432/weather_alerts

# Using any PostgreSQL client
Host: localhost
Port: 5432
Database: weather_alerts
Username: postgres
Password: password
```

## API Endpoints

### Weather API
- `GET /weather/current?city={city}` - Get current weather data

### Alerts API
- `GET /alerts` - Get all active alerts
- `POST /alerts` - Create a new alert
- `DELETE /alerts/:id` - Deactivate an alert

## Production Deployment

### Environment Variables
```env
# Backend Production
DATABASE_URL=postgresql://user:pass@prod-host:5432/weather_alerts
TOMORROW_IO_API_KEY=your_production_api_key
FROM_EMAIL=your_sender_email@example.com
SENDGRID_API_KEY=your_sendgrid_api_key
NODE_ENV=production

# Frontend Production
REACT_APP_API_URL=https://your-api-domain.com
```

### Production Considerations
1. **Database**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
2. **Environment Variables**: Use proper secrets management
3. **Monitoring**: Add logging and metrics collection
4. **Scaling**: Consider horizontal scaling for alert evaluator
5. **Notifications**: Implement proper email/SMS services
6. **Caching**: Add Redis for weather data caching

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Ant Design** with dark theme
- **FontAwesome** icons
- **Google Maps API** for location selection
- **Axios** for API communication

### Backend
- **NestJS** with TypeScript
- **TypeORM** for database operations
- **PostgreSQL** for data persistence
- **Tomorrow.io API** for weather data
- **Class Validator** for input validation

### Alert Evaluator
- **Node.js** with TypeScript
- **node-cron** for scheduled evaluations
- **TypeORM** for database access
- **Axios** for weather API calls

### Infrastructure
- **Docker Compose** for database
- **PostgreSQL 15** with JSONB support
- **Environment-based configuration**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
