import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  humidity: number;
  precipitationProbability: number;
  city: string;
}

export interface ForecastTrigger {
  datetime: string;
  predictedValue: number;
  willTrigger: boolean;
}

export interface Alert {
  id: string;
  city: string;
  parameter: 'temperature' | 'windSpeed' | 'humidity' | 'precipitationProbability';
  condition: 'above' | 'above_equal' | 'equal' | 'below_equal' | 'below' | 'between';
  thresholdMin: number;
  thresholdMax?: number;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'triggered' | 'normal';
  lastChecked: string | null;
  currentValue: number | null;
  nextTriggers: Array<{ date: string; value: number }>;
  duration?: string | null;
}

export interface CreateAlertRequest {
  city: string;
  parameter: string;
  condition: string;
  thresholdMin: number;
  thresholdMax?: number;
  email?: string;
}

export const weatherApi = {
  getCurrentWeather: (city: string): Promise<WeatherData> =>
    api.get(`/weather/current?city=${city}`).then(response => response.data),
};

export const alertsApi = {
  getAlerts: (): Promise<Alert[]> =>
    api.get('/alerts').then(response => response.data),
  
  getAlert: (id: string): Promise<Alert> =>
    api.get(`/alerts/${id}`).then(response => response.data),
  
  createAlert: (alertData: CreateAlertRequest): Promise<Alert> =>
    api.post('/alerts', alertData).then(response => response.data),
  
  deleteAlert: (id: string): Promise<Alert> =>
    api.delete(`/alerts/${id}`).then(response => response.data),
};
