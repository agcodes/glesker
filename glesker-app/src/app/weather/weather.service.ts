import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

// Interface pour les données météo
interface WeatherData {
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

// Interface pour une ville
interface City {
  name: string;
  latitude: number;
  longitude: number;
}

// Interface pour les résultats de géocodage (Nominatim)
interface GeoLocation {
  display_name: string;
  lat: string;
  lon: string;
}

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private apiUrl = 'https://api.open-meteo.com/v1/forecast';
  private readonly STORAGE_KEY = 'glesker_saved_cities';
  private readonly MAX_SAVED_CITIES = 4;

  // villes de Bretagne
  cities: City[] = [];

  constructor(private http: HttpClient) {
    this.loadSavedCities();
  }

  // Charger les villes sauvegardées depuis localStorage
  private loadSavedCities(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.cities = JSON.parse(saved);
      } catch (e) {
        console.error('Erreur de chargement des villes sauvegardées:', e);
        this.cities = [];
      }
    }
  }

  // Sauvegarder les villes dans localStorage
  private saveCities(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cities));
  }

  // Ajouter la localisation actuelle de l'utilisateur
  addCurrentLocation(latitude: number, longitude: number): void {
    // Retirer 'Ma position' si elle existe déjà
    this.cities = this.cities.filter(c => c.name !== 'Ma position');
    
    // Ajouter la nouvelle position en première position
    this.cities = [
      { name: 'Ma position', latitude, longitude },
      ...this.cities
    ];
    
    // Limiter à 4 villes maximum
    if (this.cities.length > this.MAX_SAVED_CITIES) {
      this.cities = this.cities.slice(0, this.MAX_SAVED_CITIES);
    }
    
    this.saveCities();
  }

  // Rechercher une ville par son nom
  searchCity(cityName: string): Observable<GeoLocation[]> {
    const params = {
      format: 'json',
      q: `${cityName}, France`,
      countrycodes: 'fr',
      limit: 1
    };
    const headers = { 'User-Agent': 'GleskerApp' };
    return this.http.get<GeoLocation[]>('https://nominatim.openstreetmap.org/search', { params, headers });
  }

  // Ajouter une ville par son nom
  addCityByName(cityName: string, latitude: number, longitude: number): void {
    // Vérifier si la ville existe déjà
    const cityExists = this.cities.some(c => 
      c.name.toLowerCase() === cityName.toLowerCase()
    );
    
    if (!cityExists) {
      this.cities = [
        ...this.cities,
        { name: cityName, latitude, longitude }
      ];
      
      // Limiter à 4 villes maximum
      if (this.cities.length > this.MAX_SAVED_CITIES) {
        this.cities = this.cities.slice(0, this.MAX_SAVED_CITIES);
      }
      
      this.saveCities();
    }
  }

  // Supprimer une ville de la collection
  removeCity(cityName: string): void {
    this.cities = this.cities.filter(c => c.name !== cityName);
    this.saveCities();
  }

  // Obtenir l'historique des précipitations pour une ville spécifique
  getCityPrecipitationHistory(latitude: number, longitude: number, days: number = 30): Observable<WeatherData> {
  
    const params = {
      latitude,
      longitude,
      current_weather: false,
      past_days: 60,
      forecast_days: 5,
      daily: 'precipitation_sum',
      timezone: 'Europe/Paris'
    };
    return this.http.get<WeatherData>(this.apiUrl, { params });
  }

  // Obtenir l'historique des précipitations pour une ville spécifique
  getCityTemperatureHistory(latitude: number, longitude: number, days: number = 30): Observable<WeatherData> {
  
    const params = {
      latitude,
      longitude,
      current_weather: false,
      past_days: 30,
      forecast_days: 5,
      daily: 'temperature_2m_max,temperature_2m_min',
      timezone: 'Europe/Paris'
    };
    return this.http.get<WeatherData>(this.apiUrl, { params });
  }

  // Récupérer la météo pour toutes les villes
  getWeather(): Observable<{ city: string; data: WeatherData }[]> {
    const requests = this.cities.map((city) => {
      const params = {
        latitude: city.latitude,
        longitude: city.longitude,
        current_weather: true,
        past_days: 7,
        hourly: 'precipitation,rain,showers,precipitation_probability',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,showers_sum,precipitation_hours,precipitation_probability_max,weathercode,windspeed_10m_max',
        timezone: 'Europe/Paris',
      };
      return this.http.get<WeatherData>(this.apiUrl, { params }).pipe(
        map((data) => ({ city: city.name, data }))
      );
    });

    return forkJoin(requests);
  }

  // Récupérer la météo pour une ville spécifique
  getWeatherByCoordinates(latitude: number, longitude: number): Observable<WeatherData> {
    const params = {
      latitude,
      longitude,
      current_weather: true,
      daily: 'weathercode,temperature_2m_max,temperature_2m_min',
      timezone: 'Europe/Paris',
      language: 'fr',
    };
    return this.http.get<WeatherData>(this.apiUrl, { params });
  }

  // Get all cities
  getCities(): City[] {
    return this.cities;
  }


  // Helper pour formater une date en string
  private formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Decode weather code to description
  getWeatherDescription(code: number): string {
    const weatherCodes: Record<number, string> = {
      0: 'Ciel dégagé',
      1: 'Principalement dégagé',
      2: 'Partiellement nuageux',
      3: 'Nuageux',
      45: 'Brouillard',
      48: 'Brouillard givrant',
      51: 'Bruine légère',
      53: 'Bruine modérée',
      55: 'Bruine dense',
      56: 'Bruine verglaçante légère',
      57: 'Bruine verglaçante dense',
      61: 'Pluie légère',
      63: 'Pluie modérée',
      65: 'Pluie forte',
      66: 'Pluie verglaçante légère',
      67: 'Pluie verglaçante forte',
      71: 'Chute de neige légère',
      73: 'Chute de neige modérée',
      75: 'Chute de neige forte',
      77: 'Grêle',
      80: 'Averses légères',
      81: 'Averses modérées',
      82: 'Averses violentes',
      85: 'Averses de neige légères',
      86: 'Averses de neige fortes',
      95: 'Orage',
      96: 'Orage avec grêle légère',
      99: 'Orage avec grêle forte',
    };
    return weatherCodes[code] || 'Inconnu';
  }

  // Get weather icon based on code
  getWeatherIcon(code: number): string {
    if (code === 0 || code === 1) return '☀️';
    if (code === 2 || code === 3) return '⛅';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 57) return '🌦️';
    if (code >= 61 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 85 && code <= 86) return '❄️';
    if (code >= 95 && code <= 99) return '⛈️';
    return '🌍';
  }
}
