import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { WeatherService } from '../services/weather.service';
import { CommonModule } from '@angular/common';
import { WeatherUtils } from '../utils/weather-utils';
import { HistoryPrecipitationModalComponent } from './history-precipitation-modal.component';
import { HistoryTemperatureModalComponent } from './history-temperature-modal.component';
import { HourlyTemperatureModalComponent } from './hourly-temperature-modal.component';
import { HourlyPrecipitationModalComponent } from './hourly-precipitation-modal.component';
@Component({
  selector: 'app-weather-card',
  standalone: true,
  imports: [
    CommonModule,
    HistoryPrecipitationModalComponent,
    HistoryTemperatureModalComponent,
    HourlyTemperatureModalComponent,
    HourlyPrecipitationModalComponent,
  ],
  templateUrl: './weather-card.component.html',
  styleUrl: './weather-card.component.css',
})
export class WeatherCardComponent {
  @Input() item: { city: string; data: any } | null = null;
  @Input() dayIndex: number = 7;
  @Input() defaultDayIndex: number = 7;

  todayDate: string = new Date().toISOString().split('T')[0];

  @Output() removeCity = new EventEmitter<string>();
  @Output() dayIndexChange = new EventEmitter<{ city: string; newIndex: number }>();

  selectedCityForModal: string = '';
  showHistoryPrecipitationModal: boolean = false;
  showHourlyPrecipitationModal: boolean = false;
  showHourlyTemperatureModal: boolean = false;
  showHistoryTemperatureModal: boolean = false;
  isLoadingHistoryPrecipitaion: boolean = false;
  isLoadingHourlyPrecipitation: boolean = false;
  isLoadingHourlyTemperature: boolean = false;
  isLoadingHistoryTemperature: boolean = false;

  historyPrecipitation: { date: string; precipitation: number; cumulative: number }[] = [];
  hourlyPrecipitation: { date: string; precipitation: number; cumulative: number }[] = [];
  historyTemperature: { date: string; temperature_min: number; temperature_max: number }[] = [];
  hourlyTemperature: { date: string; temperature_min: number; temperature_max: number }[] = [];

  constructor(
    public weatherService: WeatherService,
    private cdr: ChangeDetectorRef,
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

  showHourlyPrecipitation(cityName: string, date: string): void {
    const city = this.weatherService.cities.find((c) => c.name === cityName);
    if (city) {
      this.selectedCityForModal = cityName;
      this.isLoadingHourlyPrecipitation = true;
      this.showHourlyPrecipitationModal = true;
      this.cdr.detectChanges();

      this.weatherService.getHourlyWeather(city.latitude, city.longitude, date, date).subscribe({
        next: (data) => {
          this.hourlyPrecipitation = WeatherUtils.calculateCumulativePrecipitation(data.hourly);
          this.isLoadingHourlyPrecipitation = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des données:', err);
          this.isLoadingHistoryPrecipitaion = false;
          this.showHourlyPrecipitationModal = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  showHistoryPrecipitation(cityName: string): void {
    const city = this.weatherService.cities.find((c) => c.name === cityName);
    if (city) {
      this.selectedCityForModal = cityName;
      this.isLoadingHistoryPrecipitaion = true;
      this.showHistoryPrecipitationModal = true;
      this.cdr.detectChanges();

      this.weatherService.getCityPrecipitationHistory(city.latitude, city.longitude).subscribe({
        next: (data) => {
          this.historyPrecipitation = WeatherUtils.calculateCumulativeHistoryPrecipitation(
            data.daily,
          );
          this.isLoadingHistoryPrecipitaion = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Erreur lors de la récupération de l'historique:", err);
          this.isLoadingHistoryPrecipitaion = false;
          this.showHistoryPrecipitationModal = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  showHistoryTemperature(cityName: string): void {
    const city = this.weatherService.cities.find((c) => c.name === cityName);
    if (city) {
      this.selectedCityForModal = cityName;
      this.isLoadingHistoryTemperature = true;
      this.showHistoryTemperatureModal = true;
      this.cdr.detectChanges();

      this.weatherService.getCityTemperatureHistory(city.latitude, city.longitude).subscribe({
        next: (data) => {
          this.historyTemperature = this.calculateTemperatureHistory(data.daily);
          this.isLoadingHistoryTemperature = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Erreur lors de la récupération de l'historique des températures:", err);
          this.isLoadingHistoryTemperature = false;
          this.showHistoryTemperatureModal = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  showHourlyTemperature(cityName: string, date: string): void {
    const city = this.weatherService.cities.find((c) => c.name === cityName);
    if (city) {
      this.selectedCityForModal = cityName;
      this.isLoadingHourlyTemperature = true;
      this.showHourlyTemperatureModal = true;
      this.cdr.detectChanges();

      this.weatherService.getHourlyWeather(city.latitude, city.longitude, date, date).subscribe({
        next: (data) => {
          this.hourlyTemperature = this.calculateHourlyTemperature(data.hourly);
          this.isLoadingHourlyTemperature = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoadingHourlyTemperature = false;
          this.showHourlyTemperatureModal = false;
          this.cdr.detectChanges();
          console.error('Erreur lors de la récupération des données:', err);
        },
      });
    }
  }

  private calculateHourlyTemperature(
    hourly: any,
  ): { date: string; temperature_max: number; temperature_min: number }[] {
    if (!hourly?.time || !hourly?.temperature_2m_min || !hourly?.temperature_2m_max) return [];

    return hourly.time.map((date: string, index: number) => ({
      date,
      temperature_min: hourly.temperature_2m_min[index],
      temperature_max: hourly.temperature_2m_max[index],
    }));
  }

  private calculateTemperatureHistory(
    daily: any,
  ): { date: string; temperature_max: number; temperature_min: number }[] {
    if (!daily?.time || !daily?.temperature_2m_min || !daily?.temperature_2m_max) return [];

    return daily.time.map((date: string, index: number) => ({
      date,
      temperature_min: daily.temperature_2m_min[index],
      temperature_max: daily.temperature_2m_max[index],
    }));
  }

  getTotalPrecipitation(): number {
    if (!this.item?.data?.daily?.precipitation_sum) return 0;
    return this.item.data.daily.precipitation_sum.reduce((a: number, b: number) => a + b, 0);
  }

  closeHistoryPrecipitationModal(): void {
    this.showHistoryPrecipitationModal = false;
    this.historyPrecipitation = [];
    this.selectedCityForModal = '';
    this.isLoadingHistoryPrecipitaion = false;
  }

  closeHistoryTemperatureModal(): void {
    this.showHistoryTemperatureModal = false;
    this.historyTemperature = [];
    this.selectedCityForModal = '';
    this.isLoadingHistoryTemperature = false;
  }

  closeHourlyTemperatureModal(): void {
    this.showHourlyTemperatureModal = false;
    this.hourlyTemperature = [];
    this.isLoadingHourlyTemperature = false;
  }
  closeHourlyPrecipitationModal(): void {
    this.showHourlyPrecipitationModal = false;
    this.hourlyPrecipitation = [];
    this.isLoadingHistoryPrecipitaion = false;
  }
}
