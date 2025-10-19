import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Table, Button, Tag, message, Modal, Card, Tooltip } from 'antd';
import { DeleteOutlined, PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { alertsApi, Alert } from '../services/api';

interface AlertsTableProps {
  selectedCity: string;
  weatherData: any;
  weatherError: string;
  onCreateAlert: () => void;
  onAlertSelect?: (alert: Alert | null, position?: { top: number, left: number }) => void;
}

const AlertsTable = forwardRef<any, AlertsTableProps>(({ 
  selectedCity, 
  weatherData, 
  weatherError, 
  onCreateAlert,
  onAlertSelect 
}, ref) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertsApi.getAlerts();
      setAlerts(data);
    } catch (error) {
      message.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Set up polling every 30 seconds for testing (change back to 10 minutes later)
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing alerts table at:', new Date().toLocaleTimeString());
      fetchAlerts();
    }, 30 * 1000); // 30 seconds for testing
    
    console.log('✅ Polling started - will refresh every 30 seconds (testing mode)');
    
    return () => {
      console.log('❌ Polling stopped');
      clearInterval(interval);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    fetchAlerts,
    refreshAlerts: fetchAlerts,
    clearSelection: () => setSelectedAlert(null)
  }));

  const deleteAlert = async (id: string) => {
    setAlertToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!alertToDelete) return;
    
    try {
      await alertsApi.deleteAlert(alertToDelete);
      message.success('Alert deleted successfully');
      fetchAlerts();
    } catch (error) {
      message.error('Failed to delete alert');
    } finally {
      setDeleteModalOpen(false);
      setAlertToDelete(null);
    }
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleRowClick = (record: Alert, event: React.MouseEvent) => {
    const newSelected = selectedAlert?.id === record.id ? null : record;
    setSelectedAlert(newSelected);
    
    if (onAlertSelect) {
      if (newSelected && event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        const position = {
          top: rect.top, // Top of the row
          left: rect.left
        };
        onAlertSelect(newSelected, position);
      } else {
        onAlertSelect(null);
      }
    }
  };

  const alertColumns = [
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 100,
    },
    {
      title: 'Parameter',
      dataIndex: 'parameter',
      key: 'parameter',
      width: 80,
      render: (parameter: string) => {
        const parameterMap: { [key: string]: string } = {
          'temperature': 'Temp',
          'temperatureApparent': 'Feels Like',
          'windSpeed': 'Wind Speed',
          'windGust': 'Wind Gust',
          'windDirection': 'Wind Dir',
          'humidity': 'Humidity',
          'precipitationProbability': 'Rain Chance',
          'rainIntensity': 'Rain Intensity',
          'snowIntensity': 'Snow Intensity',
          'sleetIntensity': 'Sleet Intensity',
          'freezingRainIntensity': 'Freezing Rain',
          'hailProbability': 'Hail Chance',
          'hailSize': 'Hail Size',
          'pressureSeaLevel': 'Sea Pressure',
          'pressureSurfaceLevel': 'Surface Pressure',
          'dewPoint': 'Dew Point',
          'cloudCover': 'Cloud Cover',
          'cloudBase': 'Cloud Base',
          'cloudCeiling': 'Cloud Ceiling',
          'visibility': 'Visibility',
          'uvIndex': 'UV Index',
          'uvHealthConcern': 'UV Health',
          'weatherCode': 'Weather Code'
        };
        return parameterMap[parameter] || parameter;
      },
    },
    {
      title: 'Condition',
      key: 'condition',
      width: 140,
      render: (_: any, record: Alert) => {
        const conditionMap: { [key: string]: string } = {
          'above': '>',
          'above_equal': '≥',
          'equal': '=',
          'below_equal': '≤',
          'below': '<',
          'between': '↔'
        };
        
        const symbol = conditionMap[record.condition] || record.condition;
        const unit = getParameterUnit(record.parameter);
        
        if (record.condition === 'between' && record.thresholdMax) {
          return `${record.thresholdMin}${unit} ${symbol} ${record.thresholdMax}${unit}`;
        }
        return `${symbol} ${record.thresholdMin}${unit}`;
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 50,
      render: (_: any, record: Alert) => {
        const isPending = !record.lastChecked;
        const status = isPending ? 'pending' : record.status;
        
        return (
          <Tooltip title={isPending ? "Alert is pending - it might take up to an hour for the alert to start operating" : ""}>
            <Tag 
              color={
                status === 'triggered' ? 'orange' : 
                status === 'pending' ? 'blue' : 'green'
              }
              style={{ fontSize: '10px' }}
            >
              {status === 'triggered' ? 'TRIGGERED' : 
               status === 'pending' ? 'PENDING' : 'NORMAL'}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 35,
      render: (_: any, record: Alert) => (
        <Button 
          icon={<DeleteOutlined style={{ fontSize: '10px' }} />} 
          onClick={(e) => {
            e.stopPropagation();
            deleteAlert(record.id);
          }} 
          danger 
          size="small"
          style={{ 
            width: '24px', 
            height: '24px', 
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      ),
    },
  ];

  return (
    <div style={{ height: '100%', padding: '16px', backgroundColor: '#1f1f1f' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: 'white', margin: 0 }}>Active Alerts</h3>
        <Tooltip 
          title={!selectedCity ? "Select a city on the map to start monitoring weather conditions and receive personalized alerts" : ""}
          placement="left"
        >
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={onCreateAlert}
            disabled={!selectedCity}
            size="middle"
            style={{ 
              backgroundColor: !selectedCity ? '#434343' : '#1890ff',
              borderColor: !selectedCity ? '#434343' : '#1890ff',
              fontWeight: 'bold',
              height: '32px'
            }}
          >
            Create Alert
          </Button>
        </Tooltip>
      </div>
      
      <Table 
        dataSource={alerts} 
        columns={alertColumns} 
        rowKey="id" 
        size="small"
        pagination={false}
        loading={loading}
        onRow={(record) => ({
          onClick: (event) => handleRowClick(record, event),
          style: { 
            cursor: 'pointer',
            backgroundColor: selectedAlert?.id === record.id ? '#2a2a2a' : 'transparent'
          }
        })}
        style={{ 
          backgroundColor: '#1f1f1f',
          height: 'calc(100% - 60px)',
          overflow: 'auto',
          fontSize: '10px'
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <span>
            <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
            Delete Alert
          </span>
        }
        open={deleteModalOpen}
        onCancel={() => {
          setDeleteModalOpen(false);
          setAlertToDelete(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setDeleteModalOpen(false);
            setAlertToDelete(null);
          }}>
            Cancel
          </Button>,
          <Button key="delete" type="primary" danger onClick={confirmDelete}>
            Yes, Delete
          </Button>
        ]}
        centered
        width={350}
      >
        <div style={{ color: 'white' }}>
          Are you sure you want to delete this alert?
        </div>
      </Modal>
    </div>
  );
});

export default AlertsTable;
