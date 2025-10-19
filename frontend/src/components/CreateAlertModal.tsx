import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, Button, Space, message } from 'antd';
import { alertsApi } from '../services/api';

const { Option } = Select;

interface CreateAlertModalProps {
  isOpen: boolean;
  selectedCity: string;
  form: any;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateAlertModal: React.FC<CreateAlertModalProps> = ({ 
  isOpen, 
  selectedCity, 
  form, 
  onCancel, 
  onSuccess 
}) => {
  const [condition, setCondition] = useState<string>('');
  const [formValues, setFormValues] = useState<any>({});

  // Reset form whenever modal closes
  useEffect(() => {
    if (!isOpen) {
      form.resetFields();
      setCondition('');
      setFormValues({});
    }
  }, [isOpen, form]);

  const handleFormChange = (changedValues: any, allValues: any) => {
    setFormValues(allValues);
  };

  const isFormValid = () => {
    const { parameter, condition, thresholdMin, thresholdMax } = formValues;
    
    // Required fields
    if (!parameter || !condition || thresholdMin === undefined || thresholdMin === null) {
      return false;
    }
    
    // For 'between' condition, thresholdMax is also required
    if (condition === 'between' && (thresholdMax === undefined || thresholdMax === null)) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (values: any) => {
    try {
      await alertsApi.createAlert({
        city: selectedCity,
        parameter: values.parameter,
        condition: values.condition,
        thresholdMin: values.thresholdMin,
        thresholdMax: values.thresholdMax,
        email: values.email
      });
      message.success('Alert created successfully');
      form.resetFields();
      setCondition('');
      onCancel();
      onSuccess();
    } catch (error: any) {
      let errorMessage = 'Failed to create alert';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Invalid alert data';
      } else if (error.response?.status === 409) {
        errorMessage = 'Duplicate alert: An identical alert already exists';
      }
      
      message.error(errorMessage);
    }
  };

  const handleConditionChange = (value: string) => {
    setCondition(value);
    if (value !== 'between') {
      form.setFieldValue('thresholdMax', undefined);
    }
  };

  const getParameterValidation = (parameter: string) => {
    switch (parameter) {
      case 'temperature':
      case 'temperatureApparent':
      case 'dewPoint':
        return { min: -50, max: 60, suffix: '°C' };
      case 'windSpeed':
      case 'windGust':
        return { min: 0, max: 200, suffix: ' m/s' };
      case 'windDirection':
        return { min: 0, max: 360, suffix: '°' };
      case 'humidity':
      case 'precipitationProbability':
      case 'cloudCover':
      case 'hailProbability':
        return { min: 0, max: 100, suffix: '%' };
      case 'rainIntensity':
      case 'snowIntensity':
      case 'sleetIntensity':
      case 'freezingRainIntensity':
        return { min: 0, max: 100, suffix: ' mm/h' };
      case 'hailSize':
        return { min: 0, max: 100, suffix: ' mm' };
      case 'pressureSeaLevel':
      case 'pressureSurfaceLevel':
        return { min: 800, max: 1200, suffix: ' hPa' };
      case 'cloudBase':
      case 'cloudCeiling':
        return { min: 0, max: 20, suffix: ' km' };
      case 'visibility':
        return { min: 0, max: 50, suffix: ' km' };
      case 'uvIndex':
        return { min: 0, max: 15, suffix: '' };
      case 'uvHealthConcern':
        return { min: 0, max: 10, suffix: '' };
      case 'weatherCode':
        return { min: 0, max: 9999, suffix: '' };
      default:
        return { min: undefined, max: undefined, suffix: '' };
    }
  };

  const selectedParameter = form.getFieldValue('parameter');
  const validation = getParameterValidation(selectedParameter);

  return (
    <Modal
      title={`Create Alert for ${selectedCity}`}
      open={isOpen}
      onCancel={() => {
        form.resetFields();
        setCondition('');
        onCancel();
      }}
      footer={null}
      width={400}
      style={{ top: 150 }} // Move modal further down to avoid button overlap
    >
      <Form 
        form={form} 
        onFinish={handleSubmit} 
        onValuesChange={handleFormChange}
        layout="vertical" 
        style={{ marginTop: '20px' }}
      >
        <Form.Item name="parameter" label="Parameter" rules={[{ required: true }]}>
          <Select>
            <Option value="temperature">Temperature</Option>
            <Option value="temperatureApparent">Feels Like Temperature</Option>
            <Option value="windSpeed">Wind Speed</Option>
            <Option value="windGust">Wind Gust</Option>
            <Option value="windDirection">Wind Direction</Option>
            <Option value="humidity">Humidity</Option>
            <Option value="precipitationProbability">Rain Chance</Option>
            <Option value="rainIntensity">Rain Intensity</Option>
            <Option value="snowIntensity">Snow Intensity</Option>
            <Option value="sleetIntensity">Sleet Intensity</Option>
            <Option value="freezingRainIntensity">Freezing Rain Intensity</Option>
            <Option value="hailProbability">Hail Probability</Option>
            <Option value="hailSize">Hail Size</Option>
            <Option value="pressureSeaLevel">Sea Level Pressure</Option>
            <Option value="pressureSurfaceLevel">Surface Pressure</Option>
            <Option value="dewPoint">Dew Point</Option>
            <Option value="cloudCover">Cloud Cover</Option>
            <Option value="cloudBase">Cloud Base</Option>
            <Option value="cloudCeiling">Cloud Ceiling</Option>
            <Option value="visibility">Visibility</Option>
            <Option value="uvIndex">UV Index</Option>
            <Option value="uvHealthConcern">UV Health Concern</Option>
            <Option value="weatherCode">Weather Code</Option>
          </Select>
        </Form.Item>
        
        <Form.Item name="condition" label="Condition" rules={[{ required: true }]}>
          <Select onChange={handleConditionChange}>
            <Option value="above">Above (&gt;)</Option>
            <Option value="above_equal">Above or Equal (&gt;=)</Option>
            <Option value="equal">Equal (=)</Option>
            <Option value="below_equal">Below or Equal (&lt;=)</Option>
            <Option value="below">Below (&lt;)</Option>
            <Option value="between">Between</Option>
          </Select>
        </Form.Item>
        
        <Form.Item 
          name="thresholdMin" 
          label={condition === 'between' ? 'Minimum Value' : 'Threshold'} 
          rules={[
            { required: true },
            { type: 'number', min: validation.min, max: validation.max, message: `Value must be between ${validation.min} and ${validation.max}` }
          ]}
        >
          <InputNumber 
            style={{ width: '100%' }} 
            min={validation.min}
            max={validation.max}
            addonAfter={validation.suffix}
          />
        </Form.Item>
        
        {condition === 'between' && (
          <Form.Item 
            name="thresholdMax" 
            label="Maximum Value" 
            rules={[
              { required: true },
              { type: 'number', min: validation.min, max: validation.max, message: `Value must be between ${validation.min} and ${validation.max}` },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const minValue = getFieldValue('thresholdMin');
                  if (!value || !minValue || value > minValue) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Maximum value must be greater than minimum value'));
                },
              }),
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={validation.min}
              max={validation.max}
              addonAfter={validation.suffix}
            />
          </Form.Item>
        )}
        
        <Form.Item 
          name="email" 
          label="Email (Optional)" 
          rules={[{ type: 'email', message: 'Please enter a valid email' }]}
        >
          <Input placeholder="your-email@example.com" size="middle" />
        </Form.Item>
        
        <Form.Item style={{ marginBottom: '8px' }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => {
              form.resetFields();
              setCondition('');
              onCancel();
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" disabled={!isFormValid()}>
              Create Alert
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateAlertModal;
