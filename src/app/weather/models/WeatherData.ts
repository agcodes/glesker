// Interface pour les données météo
export interface WeatherData {
  latitude: number;
  longitude: number;
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  hourly?: {
    time: string[];
    precipitation: number[];
    rain: number[];
    showers: number[];
    precipitation_probability: number[];
  };
  daily?: {
    time: string[];
    precipitation_sum: number[];
    rain_sum: number[];
    showers_sum: number[];
    precipitation_hours: number[];
    precipitation_probability_max: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
}
