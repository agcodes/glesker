import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { WeatherService } from './weather.service';
import { ThemeService } from '../theme.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RainHistoryModalComponent } from './rain-history-modal.component';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule, FormsModule, RainHistoryModalComponent],
  templateUrl: './weather.component.html',
  styleUrl: './weather.component.css',
})
export class WeatherComponent implements OnInit {
  weatherData: { city: string; data: any }[] = [];
  isLoading: boolean = true;
  isSearching: boolean = false;
  error: string | null = null;
  searchError: string | null = null;
  selectedCity: string | null = null;
  searchQuery: string = '';
  dayIndexes: Record<string, number> = {};
  DEFAULT_DAY_INDEX: number = 7;
  
  // Historique des précipitations
  showHistoryModal: boolean = false;
  selectedCityForHistory: string | null = null;
  precipitationHistory: { date: string; precipitation: number; cumulative: number }[] = [];

  constructor(
    public weatherService: WeatherService,
    public themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getLocationThenLoadWeather();
  }

  // Demander la géolocalisation puis charger la météo
  getLocationThenLoadWeather(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Ajouter la localisation actuelle
          this.weatherService.addCurrentLocation(
            position.coords.latitude,
            position.coords.longitude
          );
          this.loadWeather();
        },
        (error) => {
          console.log("Géolocalisation refusée ou non disponible:", error);
          this.loadWeather(); // Charger sans la localisation
        }
      );
    } else {
      this.loadWeather(); // Navigateur ne supporte pas la géolocalisation
    }
  }

  // Rechercher une ville
  searchCity(): void {
    if (!this.searchQuery.trim()) return;

    this.searchError = "";
    this.isSearching = true;
    this.weatherService.searchCity(this.searchQuery).subscribe({
      next: (results) => {
        console.log(results);
        this.isSearching = false;
        if (results.length > 0) {
          this.searchError = "";
          const city = results[0];
          const cityName = city.display_name.split(',')[0].trim();
          this.weatherService.addCityByName(
            cityName,
            parseFloat(city.lat),
            parseFloat(city.lon)
          );
          this.searchQuery = '';
          this.loadWeather();
        }
        else {
          this.searchError = 'Ville non trouvée. Essayez un autre nom.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSearching = false;
        this.searchError = 'Ville non trouvée. Essayez un autre nom.';
        console.error('Erreur de recherche:', err);
          this.cdr.detectChanges();
      }
    });
  }

  removeCity(city:string): void {
    console.log("remove", city);
    this.weatherService.removeCity(city);
    this.loadWeather();
  }

  loadWeather(): void {
    this.isLoading = true;
    this.error = null;
    this.weatherService.getWeather().subscribe({
      next: (data) => {
        this.weatherData = data;
        this.isLoading = false;
        console.log(data)
        // Initialiser dayIndexes pour chaque ville à 7
        this.dayIndexes = {};
        data.forEach(item => {
          this.dayIndexes[item.city] = this.DEFAULT_DAY_INDEX;
        });
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des données météo:', err);
        this.error = 'Impossible de récupérer les données météo. Veuillez réessayer plus tard.';
        this.isLoading = false;
      },
    });
  }

  // Rafraîchir les données
  refresh(): void {
    this.loadWeather();
  }

  // Gérer l'index des jours
  incrementDay(cityName: string): void {
    if (this.dayIndexes[cityName] !== undefined && this.dayIndexes[cityName] < 13) {
      this.dayIndexes[cityName]++;
      this.cdr.detectChanges();
    }
  }

  decrementDay(cityName: string): void {
    if (this.dayIndexes[cityName] !== undefined && this.dayIndexes[cityName] > 0) {
      this.dayIndexes[cityName]--;
      this.cdr.detectChanges();
    }
  }

  // Afficher l'historique des précipitations
  showPrecipitationHistory(cityName: string): void {
    const city = this.weatherService.cities.find(c => c.name === cityName);
    if (city) {
      this.selectedCityForHistory = cityName;
      this.weatherService.getCityPrecipitationHistory(city.latitude, city.longitude).subscribe({
        next: (data) => {
          this.precipitationHistory = this.calculateCumulativePrecipitation(data.daily);
          this.showHistoryModal = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'historique:', err);
          this.searchError = 'Impossible de charger l\'historique.';
        }
      });
    }
  }

  // Fermer la modale
  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.precipitationHistory = [];
    this.selectedCityForHistory = null;
  }

  // Calculer les précipitations cumulées
  private calculateCumulativePrecipitation(daily: any): { date: string; precipitation: number; cumulative: number }[] {
    if (!daily?.precipitation_sum || !daily?.time) return [];

    let cumulative = 0;
    return daily.time.map((date: string, index: number) => {
      cumulative += daily.precipitation_sum[index];
      return {
        date,
        precipitation: daily.precipitation_sum[index],
        cumulative: cumulative
      };
    });
  }

  // Formater la date
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Formater la température
  formatTemperature(temp: number): string {
    return `${Math.round(temp * 10) / 10}°C`;
  }

  // Obtenir la direction du vent
  getWindDirection(degrees: number): string {
    const directions = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO',
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  // Formater un nombre avec un nombre de décimales
  formatNumber(value: any, decimals: number = 1): string {
    if (value == null) return '0';
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    const multiplier = Math.pow(10, decimals);
    const rounded = Math.round(num * multiplier) / multiplier;
    return decimals === 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
  }
}
