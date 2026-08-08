import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { WeatherService } from './weather.service';
import { ThemeService } from '../theme.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeatherCardComponent } from './weather-card.component';
import { WeatherUtils } from './weather-utils';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule, FormsModule, WeatherCardComponent],
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
          this.loadWeather();
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

  // Mettre à jour l'index du jour
  updateDayIndex(event: { city: string; newIndex: number }): void {
    this.dayIndexes[event.city] = event.newIndex;
    this.cdr.detectChanges();
  }

  // Méthodes de formatage délégées à WeatherUtils
  formatDate = WeatherUtils.formatDate;
  formatTemperature = WeatherUtils.formatTemperature;
  getWindDirection = WeatherUtils.getWindDirection;
  formatNumber = WeatherUtils.formatNumber;
}
