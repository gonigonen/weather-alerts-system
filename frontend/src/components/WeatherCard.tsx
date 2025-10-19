import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTemperatureLow, faWind, faFireFlameCurved, faCloudRain } from '@fortawesome/free-solid-svg-icons';

const { Text } = Typography;

interface WeatherData {
  temperature: number;
  windSpeed: number;
  humidity: number;
  precipitationProbability: number;
  city: string;
}

interface WeatherCardProps {
  weatherData: WeatherData | null;
  weatherError: string;
  selectedCity: string;
  weatherLoading: boolean;
}

const WeatherParameter: React.FC<{ icon: any; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
    <FontAwesomeIcon icon={icon} style={{ fontSize: '14px', width: '14px', color: '#1890ff' }} />
    <div>
      <Text type="secondary" style={{ fontSize: '11px', display: 'block', lineHeight: '1' }}>{label}</Text>
      <Text strong style={{ fontSize: '14px', lineHeight: '1' }}>{value}</Text>
    </div>
  </div>
);

const WeatherCard: React.FC<WeatherCardProps> = ({ weatherData, weatherError, selectedCity, weatherLoading }) => {
  return (
    <Card 
      size="small" 
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }} 
      loading={weatherLoading}
    >
      {weatherError ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <Text type="danger">Unable to load weather data</Text>
        </div>
      ) : weatherData && selectedCity ? (
        <div>
          <div style={{ marginBottom: '12px', textAlign: 'left' }}>
            <Text strong style={{ fontSize: '14px', color: 'white' }}>{selectedCity}</Text>
          </div>
          
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <WeatherParameter 
                icon={faTemperatureLow}
                label="Temp"
                value={`${weatherData.temperature}°C`}
              />
            </Col>
            <Col span={12}>
              <WeatherParameter 
                icon={faWind}
                label="Wind"
                value={`${weatherData.windSpeed} m/s`}
              />
            </Col>
            <Col span={12}>
              <WeatherParameter 
                icon={faFireFlameCurved}
                label="Humidity"
                value={`${weatherData.humidity}%`}
              />
            </Col>
            <Col span={12}>
              <WeatherParameter 
                icon={faCloudRain}
                label="Rain"
                value={`${weatherData.precipitationProbability}%`}
              />
            </Col>
          </Row>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <Text type="secondary" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Click on the map to select a city
          </Text>
        </div>
      )}
    </Card>
  );
};

export default WeatherCard;
