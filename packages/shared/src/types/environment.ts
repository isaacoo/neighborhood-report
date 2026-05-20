/** 대기질 등급 */
export type AirQualityGrade = 'good' | 'moderate' | 'bad' | 'veryBad';

/** 대기질 데이터 */
export interface AirQualityData {
  stationName: string;
  pm10: number;
  pm25: number;
  ozone: number;
  overallIndex: number;
  grade: AirQualityGrade;
  measuredAt: string;
}

/** 기상 데이터 */
export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  sky: 'clear' | 'cloudy' | 'overcast';
  forecastDate: string;
}

/** 생활 불편 요약 */
export interface DiscomfortSummary {
  heatWave: boolean;
  coldWave: boolean;
  heavyRain: boolean;
  description: string;
}

/** 환경 분석 결과 */
export interface EnvironmentResult {
  regionCode: string;
  airQuality: AirQualityData;
  weather: WeatherData;
  discomfort: DiscomfortSummary;
  dataTimestamp: string;
}
