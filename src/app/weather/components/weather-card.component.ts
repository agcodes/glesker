import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { WeatherService } from '../services/weather.service';
import { CommonModule } from '@angular/common';
import { WeatherUtils } from '../utils/weather-utils';
import { RainHistoryModalComponent } from './rain-history-modal.component';
import { TemperatureHistoryModalComponent } from './temperature-history-modal.component';

@Component({
  selector: 'app-weather-card',
  standalone: true,
  imports: [CommonModule, RainHistoryModalComponent, TemperatureHistoryModalComponent],
  templateUrl: './weather-card.component.html',
  styleUrl: './weather-card.component.css'
})
export class WeatherCardComponent {
  @Input() item: { city: string; data: any } | null = null;
  @Input() dayIndex: number = 7;
  @Input() defaultDayIndex: number = 7;

  todayDate: string = new Date().toISOString().split('T')[0];

  @Output() removeCity = new EventEmitter<string>();
  @Output() dayIndexChange = new EventEmitter<{ city: string; newIndex: number }>();

  showHistoryModal: boolean = false;
  showTemperatureHistoryModal: boolean = false;
  isLoadingPrecipitationHistory: boolean = false;
  isLoadingTemperatureHistory: boolean = false;
  selectedCityForHistory: string = '';
  precipitationHistory: { date: string; precipitation: number; cumulative: number }[] = [];
  temperatureHistory: { date: string; temperature_min: number; temperature_max: number }[] = [];

  constructor(
    public weatherService: WeatherService,
    private cdr: ChangeDetectorRef
  ) {}

  // Méthodes de formatage délégées à WeatherUtils
  formatTemperature = WeatherUtils.formatTemperature;
  formatDate = WeatherUtils.formatDate;
  formatNumber = WeatherUtils.formatNumber;
  getTemperatureColor = WeatherUtils.getTemperatureColor;

  onRemoveCity(city: string): void {
    this.removeCity.emit(city);
  }

  decrementDay(city: string): void {
    if (this.dayIndex > 0) {
      const newIndex = this.dayIndex - 1;
      this.dayIndexChange.emit({ city, newIndex });
    }
  }

  incrementDay(city: string): void {
    if (this.dayIndex < 13) {
      const newIndex = this.dayIndex + 1;
      this.dayIndexChange.emit({ city, newIndex });
    }
  }

  showPrecipitationHistory(cityName: string): void {
    const city = this.weatherService.cities.find(c => c.name === cityName);
    if (city) {
      this.selectedCityForHistory = cityName;
      this.isLoadingPrecipitationHistory = true;
      this.showHistoryModal = true;
      this.cdr.detectChanges();

      this.weatherService.getCityPrecipitationHistory(city.latitude, city.longitude).subscribe({
        next: (data) => {
          this.precipitationHistory = WeatherUtils.calculateCumulativePrecipitation(data.daily);
          this.isLoadingPrecipitationHistory = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'historique:', err);
          this.isLoadingPrecipitationHistory = false;
          this.showHistoryModal = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  showTemperatureHistory(cityName: string): void {
    const city = this.weatherService.cities.find(c => c.name === cityName);
    if (city) {
      this.selectedCityForHistory = cityName;
      this.isLoadingTemperatureHistory = true;
      this.showTemperatureHistoryModal = true;
      this.cdr.detectChanges();

      this.weatherService.getCityTemperatureHistory(city.latitude, city.longitude).subscribe({
        next: (data) => {
          this.temperatureHistory = this.calculateTemperatureHistory(data.daily);
          this.isLoadingTemperatureHistory = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'historique des températures:', err);
          this.isLoadingTemperatureHistory = false;
          this.showTemperatureHistoryModal = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  private calculateTemperatureHistory(daily: any): { date: string; 
    temperature_max: number; 
    temperature_min: number }[] {
    if (!daily?.time || !daily?.temperature_2m_min || !daily?.temperature_2m_max) return [];

    return daily.time.map((date: string, index: number) => ({
      date,
      temperature_min: daily.temperature_2m_min[index],
      temperature_max: daily.temperature_2m_max[index]
    }));
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.precipitationHistory = [];
    this.selectedCityForHistory = '';
    this.isLoadingPrecipitationHistory = false;
  }

  closeTemperatureHistoryModal(): void {
    this.showTemperatureHistoryModal = false;
    this.temperatureHistory = [];
    this.selectedCityForHistory = '';
    this.isLoadingTemperatureHistory = false;
  }
}
