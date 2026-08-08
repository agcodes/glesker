import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { WeatherService } from './weather.service';
import { CommonModule } from '@angular/common';
import { WeatherUtils } from './weather-utils';
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

  @Output() removeCity = new EventEmitter<string>();
  @Output() dayIndexChange = new EventEmitter<{ city: string; newIndex: number }>();

  showHistoryModal: boolean = false;
  showTemperatureHistoryModal: boolean = false;
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
      this.weatherService.getCityPrecipitationHistory(city.latitude, city.longitude).subscribe({
        next: (data) => {
          this.precipitationHistory = WeatherUtils.calculateCumulativePrecipitation(data.daily);
          this.showHistoryModal = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'historique:', err);
        }
      });
    }
  }

  showTemperatureHistory(cityName: string): void {
    const city = this.weatherService.cities.find(c => c.name === cityName);
    if (city) {
      this.selectedCityForHistory = cityName;
      this.weatherService.getCityTemperatureHistory(city.latitude, city.longitude).subscribe({
        next: (data) => {
          this.temperatureHistory = this.calculateTemperatureHistory(data.daily);
          this.showTemperatureHistoryModal = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'historique des températures:', err);
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
  }

  closeTemperatureHistoryModal(): void {
    this.showTemperatureHistoryModal = false;
    this.temperatureHistory = [];
    this.selectedCityForHistory = '';
  }
}
