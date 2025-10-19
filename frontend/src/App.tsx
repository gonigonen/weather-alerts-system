import React, { useState, useRef, useEffect } from 'react';
import { Layout, Row, Col, Form, notification, ConfigProvider, theme, Button, message, Modal, Alert } from 'antd';
import { PlusOutlined, BellOutlined } from '@ant-design/icons';
import WeatherCard from './components/WeatherCard';
import AlertsTable from './components/AlertsTable';
import CreateAlertModal from './components/CreateAlertModal';
import MapComponent from './components/MapComponent';
import { weatherApi, alertsApi, WeatherData } from './services/api';
import { useWebhook } from './hooks/useWebhook';
import './App.css';

const { Header, Content } = Layout;

// Add CSS for slide animation
const slideInRightCSS = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// Inject CSS
if (!document.getElementById('slide-animation')) {
  const style = document.createElement('style');
  style.id = 'slide-animation';
  style.textContent = slideInRightCSS;
  document.head.appendChild(style);
}

function App() {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string>('');
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [triggeredAlertsCount, setTriggeredAlertsCount] = useState(0);
  const [hasSeenAlerts, setHasSeenAlerts] = useState(false);
  const [selectedAlertForDetails, setSelectedAlertForDetails] = useState<any>(null);
  const [alertCardPosition, setAlertCardPosition] = useState({ top: 0, left: 0 });
  const bubbleContentRef = useRef<HTMLDivElement>(null);
  
  const [form] = Form.useForm();
  const alertsTableRef = useRef<any>(null);

  // Load triggered alerts count on component mount
  useEffect(() => {
    updateTriggeredAlertsCount();
  }, []);

  // Poll for triggered alerts and show notifications
  useEffect(() => {
    let previousCount = 0;
    
    const checkForTriggeredAlerts = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/alerts`);
        const alerts = await response.json();
        const currentTriggeredCount = alerts.filter((alert: any) => alert.status === 'triggered').length;
        
        console.log('Checking alerts:', { previousCount, currentTriggeredCount }); // Debug log
        
        // Show notification ONLY if new alerts were triggered (not existing ones)
        if (previousCount > 0 && currentTriggeredCount > previousCount) {
          const newTriggeredCount = currentTriggeredCount - previousCount;
          
          setAlertTriggered({
            show: true,
            message: newTriggeredCount.toString(),
            type: 'warning'
          });

          // Refresh alerts table
          if (alertsTableRef.current) {
            alertsTableRef.current.refreshAlerts();
          }
        }
        
        previousCount = currentTriggeredCount;
        setTriggeredAlertsCount(currentTriggeredCount);
      } catch (error) {
        console.error('Failed to check triggered alerts:', error);
      }
    };

    // Check immediately and then every 15 seconds for faster detection
    checkForTriggeredAlerts();
    const interval = setInterval(checkForTriggeredAlerts, 15000);
    
    return () => clearInterval(interval);
  }, []);
  // Initialize webhook notifications (no polling)
  const { simulateWebhook } = useWebhook();

  const fetchWeatherData = async (city: string) => {
    try {
      setWeatherLoading(true);
      setWeatherError('');
      const data = await weatherApi.getCurrentWeather(city);
      setWeatherData(data);
    } catch (error: any) {
      setWeatherData(null);
      let errorMessage = 'Failed to fetch weather data';
      
      if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'API authentication failed.';
      } else if (error.response?.status === 404) {
        errorMessage = 'City not found. Please try a different city.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setWeatherError(errorMessage);
      
      notification.error({
        message: 'Weather Data Error',
        description: errorMessage,
        placement: 'topRight',
        duration: 5
      });
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    fetchWeatherData(city);
  };

  const handleAlertCreated = () => {
    if (alertsTableRef.current) {
      alertsTableRef.current.fetchAlerts();
    }
    updateTriggeredAlertsCount();
  };

  // Configure notification
  useEffect(() => {
    notification.config({
      placement: 'topRight',
      duration: 6,
    });
  }, []);

  const [alertTriggered, setAlertTriggered] = useState<{show: boolean, message: string, type: 'warning' | 'info'}>({show: false, message: '', type: 'warning'});

  const getParameterDisplayName = (parameter: string) => {
    const parameterMap: { [key: string]: string } = {
      'temperature': 'Temperature',
      'temperatureApparent': 'Feels Like Temperature',
      'windSpeed': 'Wind Speed',
      'windGust': 'Wind Gust',
      'windDirection': 'Wind Direction',
      'humidity': 'Humidity',
      'precipitationProbability': 'Rain Chance',
      'rainIntensity': 'Rain Intensity',
      'snowIntensity': 'Snow Intensity',
      'sleetIntensity': 'Sleet Intensity',
      'freezingRainIntensity': 'Freezing Rain Intensity',
      'hailProbability': 'Hail Probability',
      'hailSize': 'Hail Size',
      'pressureSeaLevel': 'Sea Level Pressure',
      'pressureSurfaceLevel': 'Surface Pressure',
      'dewPoint': 'Dew Point',
      'cloudCover': 'Cloud Cover',
      'cloudBase': 'Cloud Base',
      'cloudCeiling': 'Cloud Ceiling',
      'visibility': 'Visibility',
      'uvIndex': 'UV Index',
      'uvHealthConcern': 'UV Health Concern',
      'weatherCode': 'Weather Code'
    };
    return parameterMap[parameter] || parameter;
  };

  const getParameterUnit = (parameter: string) => {
    switch (parameter) {
      case 'temperature':
      case 'temperatureApparent':
      case 'dewPoint':
        return '°C';
      case 'windSpeed':
      case 'windGust':
        return ' m/s';
      case 'humidity':
      case 'precipitationProbability':
      case 'cloudCover':
      case 'hailProbability':
        return '%';
      case 'rainIntensity':
      case 'snowIntensity':
      case 'sleetIntensity':
      case 'freezingRainIntensity':
        return ' mm/h';
      case 'hailSize':
        return ' mm';
      case 'pressureSeaLevel':
      case 'pressureSurfaceLevel':
        return ' hPa';
      case 'cloudBase':
      case 'cloudCeiling':
      case 'visibility':
        return ' km';
      case 'windDirection':
        return '°';
      case 'uvIndex':
      case 'uvHealthConcern':
      case 'weatherCode':
        return '';
      default:
        return '';
    }
  };

  const updateTriggeredAlertsCount = async () => {
    try {
      const alerts = await alertsApi.getAlerts();
      const triggeredCount = alerts.filter((alert: any) => alert.status === 'triggered').length;
      
      // Only show badge if count increased or user hasn't seen alerts yet
      if (triggeredCount > triggeredAlertsCount || !hasSeenAlerts) {
        setTriggeredAlertsCount(triggeredCount);
        if (triggeredCount === 0) {
          setHasSeenAlerts(false);
        }
      }
    } catch (error) {
      console.error('Failed to update triggered alerts count:', error);
    }
  };

  const handleTableToggle = () => {
    const newExpanded = !isTableExpanded;
    setIsTableExpanded(newExpanded);
    
    // Clear the badge when user opens the table
    if (newExpanded) {
      setTriggeredAlertsCount(0);
      setHasSeenAlerts(true);
    } else {
      // Clear the alert bubble when table closes
      setSelectedAlertForDetails(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setSelectedAlertForDetails(null);
      // Clear table row selection when bubble closes
      if (alertsTableRef.current) {
        alertsTableRef.current.clearSelection();
      }
    };

    if (selectedAlertForDetails) {
      // Add small delay to prevent immediate closing when opening
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [selectedAlertForDetails]);

  // Reset scroll position when alert changes
  useEffect(() => {
    if (bubbleContentRef.current) {
      bubbleContentRef.current.scrollTop = 0;
    }
  }, [selectedAlertForDetails]);

  const handleAlertSelect = (alert: any, position?: { top: number, left: number }) => {
    console.log('🎯 Selected alert data:', alert);
    console.log('🎯 Next triggers:', alert?.nextTriggers);
    setSelectedAlertForDetails(alert);
    if (position) {
      setAlertCardPosition(position);
    }
  };
  const handleRefreshAlerts = () => {
    if (alertsTableRef.current) {
      alertsTableRef.current.refreshAlerts();
    }
    updateTriggeredAlertsCount();
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
      }}
    >
      <Layout style={{ height: '100vh' }}>
        <Header style={{ background: '#141414', color: 'white', textAlign: 'center' }}>
          <h3 style={{ color: 'white', margin: 0 }}>Weather Alerts System</h3>
        </Header>
        <Content style={{ padding: '20px', height: 'calc(100vh - 64px)', paddingBottom: '20px' }}>
          {/* Floating Alert Banner - Top Right */}
          {alertTriggered.show && (
            <Alert
              message={`You have ${alertTriggered.message} new triggered alert${alertTriggered.message !== '1' ? 's' : ''}`}
              type="warning"
              showIcon={false}
              closable
              onClose={() => setAlertTriggered({show: false, message: '', type: 'warning'})}
              style={{
                position: 'fixed',
                top: '10px',
                right: '20px',
                width: '250px',
                fontSize: '13px',
                zIndex: 1001,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                animation: 'slideInRight 0.3s ease-out'
              }}
            />
          )}
          
          <Row gutter={[20, 20]} style={{ height: 'calc(100% - 20px)' }}>
            {/* Left side - Map (dynamic width) */}
            <Col span={isTableExpanded ? 14 : 24} style={{ height: '100%', transition: 'all 0.3s ease' }}>
              <div style={{ position: 'relative', height: '100%' }}>
                <MapComponent onCitySelect={handleCitySelect} />
                
                {/* Weather Card - Below search bar */}
                {selectedCity && weatherData && (
                  <div style={{
                    position: 'absolute',
                    top: '60px', // Below search bar
                    left: '10px', // Same as search bar
                    width: '250px', // Same width as search bar
                    zIndex: 1001
                  }}>
                    <WeatherCard 
                      weatherData={weatherData}
                      weatherError={weatherError}
                      selectedCity={selectedCity}
                      weatherLoading={weatherLoading}
                    />
                  </div>
                )}

                {/* Alert Details Card - Speech bubble style */}
                {selectedAlertForDetails && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{
                    position: 'fixed',
                    top: Math.min(alertCardPosition.top, window.innerHeight - 350),
                    left: Math.max(alertCardPosition.left - 400, 20), // Keep within map bounds
                    width: '380px',
                    zIndex: 1002,
                    pointerEvents: 'none' // Don't interfere with map interactions
                  }}>
                    <div style={{
                      backgroundColor: '#1f1f1f',
                      border: '1px solid #434343',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      color: 'white',
                      position: 'relative',
                      pointerEvents: 'auto'
                    }}>
                      {/* Speech bubble arrow pointing right - aligned with row center */}
                      <div style={{
                        position: 'absolute',
                        right: '-8px',
                        top: '20px', // Fixed position to align with row center
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid #434343',
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent'
                      }}></div>
                      <div style={{
                        position: 'absolute',
                        right: '-7px',
                        top: '20px', // Fixed position to align with row center
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid #1f1f1f',
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent'
                      }}></div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        {selectedAlertForDetails.status === 'triggered' ? (
                          <h4 style={{ margin: 0, color: '#ff4d4f', fontSize: '16px' }}>
                            🚨 Currently Triggered
                          </h4>
                        ) : (
                          <h4 style={{ margin: 0, color: '#1890ff', fontSize: '14px', fontWeight: 'bold' }}>
                            {selectedAlertForDetails.city} - {getParameterDisplayName(selectedAlertForDetails.parameter)} {
                             selectedAlertForDetails.condition === 'above' ? '>' :
                             selectedAlertForDetails.condition === 'above_equal' ? '≥' :
                             selectedAlertForDetails.condition === 'equal' ? '=' :
                             selectedAlertForDetails.condition === 'below_equal' ? '≤' :
                             selectedAlertForDetails.condition === 'below' ? '<' : '↔'
                            } {selectedAlertForDetails.thresholdMin}{getParameterUnit(selectedAlertForDetails.parameter)}{selectedAlertForDetails.thresholdMax ? ` - ${selectedAlertForDetails.thresholdMax}${getParameterUnit(selectedAlertForDetails.parameter)}` : ''}
                          </h4>
                        )}
                        <Button 
                          size="small" 
                          onClick={() => setSelectedAlertForDetails(null)}
                          style={{ 
                            border: 'none', 
                            background: 'transparent', 
                            color: '#999', 
                            padding: '2px 4px'
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                        
                        {!selectedAlertForDetails.lastChecked ? (
                          <div style={{ color: '#fff', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                            ⏳ Alert is pending - it might take up to an hour for the alert to start operating
                          </div>
                        ) : selectedAlertForDetails.status === 'triggered' && (
                          <div style={{ color: '#fff', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                            {selectedAlertForDetails.city} {getParameterDisplayName(selectedAlertForDetails.parameter)} is now {selectedAlertForDetails.currentValue}{getParameterUnit(selectedAlertForDetails.parameter)}
                          </div>
                        )}
                        
                        {selectedAlertForDetails.nextTriggers && Array.isArray(selectedAlertForDetails.nextTriggers) && selectedAlertForDetails.nextTriggers.length > 0 ? (
                          <div style={{ marginBottom: '6px' }}>
                            <div style={{ color: '#fff', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px' }}>
                              🔮 Next trigger expectations in 3 days ({selectedAlertForDetails.nextTriggers.length}):
                            </div>
                            <div 
                              ref={bubbleContentRef}
                              style={{ 
                              height: selectedAlertForDetails.nextTriggers.length >= 4 ? '180px' : 'auto',
                              maxHeight: '180px',
                              overflowY: selectedAlertForDetails.nextTriggers.length >= 4 ? 'scroll' : 'visible', 
                              border: '2px solid #faad14',
                              borderRadius: '4px',
                              padding: '6px',
                              backgroundColor: '#2a2a2a',
                              scrollbarWidth: 'auto'
                            }}>
                              {selectedAlertForDetails.nextTriggers.map((trigger: any, index: number) => (
                                <div key={index} style={{ 
                                  fontSize: '13px', 
                                  marginBottom: '6px',
                                  padding: '6px 8px',
                                  backgroundColor: '#333',
                                  borderRadius: '4px',
                                  borderLeft: '3px solid #faad14'
                                }}>
                                  <div style={{ fontWeight: 'bold', color: '#faad14', marginBottom: '2px' }}>
                                    📅 {new Date(trigger.date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  <div style={{ color: '#fff' }}>
                                    🌡️ {trigger.value}{getParameterUnit(selectedAlertForDetails.parameter)} • ⏰ in {trigger.hoursFromNow}h
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : selectedAlertForDetails.status !== 'triggered' && selectedAlertForDetails.lastChecked && (
                          <div style={{ color: '#fff', fontSize: '12px', marginBottom: '6px' }}>
                            ✅ No triggers expected in next 3 days
                          </div>
                        )}
                        
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '8px', borderTop: '1px solid #333', paddingTop: '4px' }}>
                          Current: {selectedAlertForDetails.currentValue || 'N/A'} • Last checked: {selectedAlertForDetails.lastChecked ? new Date(selectedAlertForDetails.lastChecked).toLocaleString() : 'Never'}
                        </div>
                        
                        {selectedAlertForDetails.email && (
                          <div style={{ color: '#1890ff', fontSize: '11px', marginTop: '6px', textAlign: 'center' }}>
                            📧 {selectedAlertForDetails.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  zIndex: 1001
                }}>
                  <div 
                    onClick={handleTableToggle}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: '#1f1f1f',
                      padding: '12px 16px',
                      borderRadius: '20px',
                      border: '1px solid #434343',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      position: 'relative'
                    }}
                  >
                    <BellOutlined style={{ color: 'orange', fontSize: '14px' }} />
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                      Alerts
                    </span>
                    {triggeredAlertsCount > 0 && !hasSeenAlerts && (
                      <div style={{
                        position: 'absolute',
                        top: '-6px',
                        left: '6px',
                        backgroundColor: '#ff4d4f',
                        color: 'white',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        border: '2px solid #1f1f1f'
                      }}>
                        {triggeredAlertsCount}
                      </div>
                    )}
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                      {isTableExpanded ? '▶' : '◀'}
                    </span>
                  </div>
                </div>
              </div>
            </Col>

            {/* Right side - Alerts Table (conditional) */}
            {isTableExpanded && (
              <Col span={10} style={{ height: '100%' }}>
                <AlertsTable 
                  ref={alertsTableRef}
                  selectedCity={selectedCity}
                  weatherData={weatherData}
                  weatherError={weatherError}
                  onCreateAlert={() => setIsModalOpen(true)}
                  onAlertSelect={handleAlertSelect}
                />
              </Col>
            )}
          </Row>

          <CreateAlertModal 
            isOpen={isModalOpen}
            selectedCity={selectedCity}
            form={form}
            onCancel={() => setIsModalOpen(false)}
            onSuccess={handleAlertCreated}
          />
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
