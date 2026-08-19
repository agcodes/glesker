import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { WeatherService } from '../services/weather.service';
import { MapService } from '../services/map.service';
import { ThemeService } from '../../theme.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeatherCardComponent } from './weather-card.component';
import { WeatherUtils } from '../utils/weather-utils';
import { tap, map, startWith, catchError, of, interval, Subscription } from 'rxjs';

interface WeatherState {
  status: 'loading' | 'success' | 'error';
  data?: { city: string; data: any }[];
  message?: string;
}

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule, FormsModule, WeatherCardComponent],
  templateUrl: './weather.component.html',
  styleUrl: './weather.component.css',
})
export class WeatherComponent implements OnInit {
  private autoRefreshSubscription: Subscription | null = null;
  private readonly REFRESH_INTERVAL_MS = 1000 * 60 * 30;
  weatherData: { city: string; data: any }[] = [];
  isLoading: boolean = true;
  noCity: boolean = true;
  isSearching: boolean = false;
  error: string | null = null;
  searchError: string | null = null;
  searchQuery: string = '';
  searchResults: any[] = [];
  showSearchResults: boolean = false;
  dayIndexes: Record<string, number> = {};
  DEFAULT_DAY_INDEX: number = 7;

  constructor(
    public weatherService: WeatherService,
    public mapService: MapService,
    public themeService: ThemeService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getLocationThenLoadWeather();
  }

  // Ajoute ngOnDestroy pour nettoyer
  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      this.autoRefreshSubscription = null;
    }
  }

  // Ajoute cette méthode
  private startAutoRefresh(): void {
    this.autoRefreshSubscription = interval(this.REFRESH_INTERVAL_MS).subscribe(() => {
      this.loadWeather();
    });
  }

  // Demander la géolocalisation puis charger la météo
  getLocationThenLoadWeather(): void {
    this.loadWeather();
  }

  searchPosition(): void {
    this.isSearching = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // add current location
          this.weatherService.addCurrentLocation(
            position.coords.latitude,
            position.coords.longitude,
          );
          this.isSearching = false;

          // load weather
          this.loadWeather();
        },
        (error) => {
          this.searchError = 'Géolocalisation refusée ou non disponible';
          this.isSearching = false;
        },
      );
    } else {
      this.isSearching = false;
      this.searchError = 'Position non disponible';
    }
  }

  // Rechercher une ville
  searchCity(): void {
    if (!this.searchQuery.trim()) return;

    this.searchError = '';
    this.isSearching = true;
    this.showSearchResults = false;
    this.mapService.searchCity(this.searchQuery).subscribe({
      next: (results) => {
        this.isSearching = false;
        if (results.length > 0) {
          this.searchError = '';
          this.searchResults = results;
          if (results.length === 1) {
            this.selectCity(results[0]);
          } else {
            this.showSearchResults = true;
          }
        } else {
          this.searchError = 'Ville non trouvée. Essayez un autre nom.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSearching = false;
        this.searchError = 'Erreur rencontrée';
        this.cdr.detectChanges();
      },
    });
  }

  // Sélectionner une ville depuis les résultats de recherche
  selectCity(city: any): void {
    const cityName = city.display_name.split(',')[0].trim();
    this.weatherService.addCityByName(cityName, parseFloat(city.lat), parseFloat(city.lon));
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchResults = false;
    this.loadWeather();
  }

  // Annuler la sélection et cacher les résultats
  cancelSelection(): void {
    this.searchResults = [];
    this.showSearchResults = false;
    this.searchQuery = '';
  }

  removeCity(city: string): void {
    this.weatherService.removeCity(city);
    this.loadWeather();
  }

  loadWeather(): void {
    this.stopAutoRefresh();

    this.isLoading = true;
    this.error = null;

    if (this.weatherService.getCities()?.length == 0) {
      this.isLoading = false;
      this.weatherData = [];
      this.dayIndexes = {};
      this.noCity = true;
      this.cdr.detectChanges();
      return;
    }

    this.noCity = false;

    this.weatherService
      .getWeather()
      .pipe(
        tap((data) => {
          this.dayIndexes = {};
          data.forEach((item) => {
            this.dayIndexes[item.city] = this.DEFAULT_DAY_INDEX;
          });
        }),
        map((data) => ({ status: 'success', data }) as WeatherState),
        startWith({ status: 'loading' } as WeatherState),
        catchError((err) => {
          return of({
            status: 'error',
            message: 'Impossible de récupérer les données météo. Veuillez réessayer plus tard.',
          } as WeatherState);
        }),
      )
      .subscribe((state: WeatherState) => {
        //console.log('Weather data:', state.data);
        this.startAutoRefresh();
        if (state.status === 'success') {
          this.weatherData = state.data!;
          this.isLoading = false;
        } else if (state.status === 'error') {
          this.isLoading = false;
        }
        this.cdr.detectChanges();
      });
  }

  // Rafraîchir les données
  refresh(): void {
    this.stopAutoRefresh();
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
