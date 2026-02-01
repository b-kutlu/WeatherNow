export interface HourlyForecast {
  time: string;
  temp_c: number;
}

export interface DailyForecast {
  day: string;
  min_temp: number;
  max_temp: number;
  condition: string;
}

export interface CurrentWeather {
  temp_c: number;
  condition: string;
  humidity: string;
  wind: string;
  feels_like?: number;
  uv_index?: number;
}

export interface WeatherData {
  location: string;
  coordinates: { lat: number; lon: number };
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  summary: string;
}

export interface AirQualityData {
  current: {
    us_aqi: number;
    european_aqi: number;
    pm2_5: number;
    pm10: number;
    no2: number;
    o3: number;
    so2: number;
    co: number;
  };
  hourly: {
    time: string;
    us_aqi: number;
  }[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}