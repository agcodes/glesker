import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeatherCardComponent } from './weather-card.component';
import { WeatherService } from '../services/weather.service';
import { CommonModule } from '@angular/common';
import { RainHistoryModalComponent } from './rain-history-modal.component';
import { TemperatureHistoryModalComponent } from './temperature-history-modal.component';
import { of, throwError } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { WeatherUtils } from '../utils/weather-utils';

describe('WeatherCardComponent', () => {
  let component: WeatherCardComponent;
  let fixture: ComponentFixture<WeatherCardComponent>;
  let weatherServiceMock: any;
  let cdrMock: any;

  const mockWeatherData = {
    city: 'Rennes',
    data: {
      latitude: 48.1147,
      longitude: -1.6794,
      current_weather: {
        temperature: 15,
        windspeed: 10,
        winddirection: 180,
        weathercode: 0,
        time: '2024-01-01T12:00:00Z',
      },
      current_weather_units: {
        temperature: '°C',
        windspeed: 'km/h',
      },
      daily: {
        time: Array(14).fill(null).map((_, i) => `2024-01-${String(i+1).padStart(2, '0')}`),
        weathercode: Array(14).fill(0),
        precipitation_sum: Array(14).fill(5),
        temperature_2m_max: Array(14).fill(15),
        temperature_2m_min: Array(14).fill(10),
        showers_sum: Array(14).fill(2),
        precipitation_probability_max: Array(14).fill(20),
        windspeed_10m_max: Array(14).fill(15),
        precipitation_hours: Array(14).fill(3),
      },
      daily_units: {
        windspeed_10m_max: 'km/h',
        precipitation_sum: 'mm',
        showers_sum: 'mm',
        precipitation_hours: 'h',
      },
    },
  };

  beforeEach(async () => {
    weatherServiceMock = {
      cities: [
        { name: 'Rennes', latitude: 48.1147, longitude: -1.6794 },
        { name: 'Brest', latitude: 48.3858, longitude: -4.4891 },
      ],
      getCityPrecipitationHistory: vi.fn().mockReturnValue(of({
        daily: {
          time: ['2024-01-01', '2024-01-02', '2024-01-03'],
          precipitation_sum: [10, 5, 15],
        },
      })),
      getCityTemperatureHistory: vi.fn().mockReturnValue(of({
        daily: {
          time: ['2024-01-01', '2024-01-02', '2024-01-03'],
          temperature_2m_max: [15, 16, 17],
          temperature_2m_min: [10, 11, 12],
        },
      })),
      getWeatherIcon: (code: number) => '☀️',
      getWeatherDescription: (code: number) => 'Ciel dégagé',
    };

    cdrMock = {
      detectChanges: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, RainHistoryModalComponent, TemperatureHistoryModalComponent],
      providers: [
        { provide: WeatherService, useValue: weatherServiceMock },
        { provide: ChangeDetectorRef, useValue: cdrMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherCardComponent);
    component = fixture.componentInstance;
    component.item = mockWeatherData;
    component.dayIndex = 7;
    component.defaultDayIndex = 7;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.showHistoryModal).toBe(false);
    expect(component.showTemperatureHistoryModal).toBe(false);
    expect(component.isLoadingPrecipitationHistory).toBe(false);
    expect(component.isLoadingTemperatureHistory).toBe(false);
    expect(component.selectedCityForHistory).toBe('');
    expect(component.precipitationHistory).toEqual([]);
    expect(component.temperatureHistory).toEqual([]);
  });

  it('should have todayDate set to current date in YYYY-MM-DD format', () => {
    const expectedDate = new Date().toISOString().split('T')[0];
    expect(component.todayDate).toBe(expectedDate);
  });

  describe('Input/Output', () => {
    it('should have item input', () => {
      expect(component.item).toEqual(mockWeatherData);
    });

    it('should have removeCity output', () => {
      expect(component.removeCity).toBeDefined();
    });

    it('should have dayIndexChange output', () => {
      expect(component.dayIndexChange).toBeDefined();
    });
  });

  describe('Format methods from WeatherUtils', () => {
    it('should have formatTemperature method', () => {
      expect(component.formatTemperature).toBe(WeatherUtils.formatTemperature);
    });

    it('should have formatDate method', () => {
      expect(component.formatDate).toBe(WeatherUtils.formatDate);
    });

    it('should have formatNumber method', () => {
      expect(component.formatNumber).toBe(WeatherUtils.formatNumber);
    });

    it('should have getTemperatureColor method', () => {
      expect(component.getTemperatureColor).toBe(WeatherUtils.getTemperatureColor);
    });
  });

  describe('onRemoveCity', () => {
    it('should emit removeCity event with city name', () => {
      const emitSpy = vi.spyOn(component.removeCity, 'emit');
      component.onRemoveCity('Rennes');
      expect(emitSpy).toHaveBeenCalledWith('Rennes');
    });
  });

  describe('decrementDay', () => {
    it('should not decrement when dayIndex is 0', () => {
      component.dayIndex = 0;
      const emitSpy = vi.spyOn(component.dayIndexChange, 'emit');
      component.decrementDay('Rennes');
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should decrement dayIndex and emit event', () => {
      component.dayIndex = 5;
      const emitSpy = vi.spyOn(component.dayIndexChange, 'emit');
      component.decrementDay('Rennes');
      expect(emitSpy).toHaveBeenCalledWith({ city: 'Rennes', newIndex: 4 });
    });
  });

  describe('incrementDay', () => {
    it('should not increment when dayIndex is 13', () => {
      component.dayIndex = 13;
      const emitSpy = vi.spyOn(component.dayIndexChange, 'emit');
      component.incrementDay('Rennes');
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should increment dayIndex and emit event', () => {
      component.dayIndex = 5;
      const emitSpy = vi.spyOn(component.dayIndexChange, 'emit');
      component.incrementDay('Rennes');
      expect(emitSpy).toHaveBeenCalledWith({ city: 'Rennes', newIndex: 6 });
    });
  });

  describe('showPrecipitationHistory', () => {
    it('should not show modal when city not found', () => {
      component.showPrecipitationHistory('UnknownCity');
      expect(component.selectedCityForHistory).toBe('');
      expect(component.showHistoryModal).toBe(false);
    });

    it('should load precipitation history and update state', () => {
      const mockHistory = [
        { date: '2024-01-01', precipitation: 10, cumulative: 10 },
        { date: '2024-01-02', precipitation: 5, cumulative: 15 },
        { date: '2024-01-03', precipitation: 15, cumulative: 30 },
      ];
      weatherServiceMock.getCityPrecipitationHistory.mockReturnValueOnce(of({
        daily: {
          time: ['2024-01-01', '2024-01-02', '2024-01-03'],
          precipitation_sum: [10, 5, 15],
        },
      }));
      vi.spyOn(WeatherUtils, 'calculateCumulativePrecipitation').mockReturnValueOnce(mockHistory);

      component.showPrecipitationHistory('Rennes');

      expect(component.precipitationHistory).toEqual(mockHistory);
      expect(component.isLoadingPrecipitationHistory).toBe(false);
    });

    it('should handle error when loading precipitation history', () => {
      weatherServiceMock.getCityPrecipitationHistory.mockReturnValueOnce(throwError(() => new Error('API error')));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.showPrecipitationHistory('Rennes');

      expect(consoleSpy).toHaveBeenCalled();
      expect(component.isLoadingPrecipitationHistory).toBe(false);
      expect(component.showHistoryModal).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('showTemperatureHistory', () => {
    it('should not show modal when city not found', () => {
      component.showTemperatureHistory('UnknownCity');
      expect(component.selectedCityForHistory).toBe('');
      expect(component.showTemperatureHistoryModal).toBe(false);
    });

    it('should load temperature history and update state', () => {
      const mockHistory = [
        { date: '2024-01-01', temperature_max: 15, temperature_min: 10 },
        { date: '2024-01-02', temperature_max: 16, temperature_min: 11 },
      ];
      weatherServiceMock.getCityTemperatureHistory.mockReturnValueOnce(of({
        daily: {
          time: ['2024-01-01', '2024-01-02'],
          temperature_2m_max: [15, 16],
          temperature_2m_min: [10, 11],
        },
      }));
      vi.spyOn(component as any, 'calculateTemperatureHistory').mockReturnValueOnce(mockHistory);

      component.showTemperatureHistory('Rennes');

      expect(component.temperatureHistory).toEqual(mockHistory);
      expect(component.isLoadingTemperatureHistory).toBe(false);
    });

    it('should handle error when loading temperature history', () => {
      weatherServiceMock.getCityTemperatureHistory.mockReturnValueOnce(throwError(() => new Error('API error')));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      component.showTemperatureHistory('Rennes');

      expect(consoleSpy).toHaveBeenCalled();
      expect(component.isLoadingTemperatureHistory).toBe(false);
      expect(component.showTemperatureHistoryModal).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('calculateTemperatureHistory', () => {
    it('should return empty array when daily data is missing', () => {
      const result = (component as any).calculateTemperatureHistory(null);
      expect(result).toEqual([]);
    });

    it('should calculate temperature history correctly', () => {
      const daily = {
        time: ['2024-01-01', '2024-01-02', '2024-01-03'],
        temperature_2m_max: [15, 16, 17],
        temperature_2m_min: [10, 11, 12],
      };

      const result = (component as any).calculateTemperatureHistory(daily);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ date: '2024-01-01', temperature_min: 10, temperature_max: 15 });
      expect(result[1]).toEqual({ date: '2024-01-02', temperature_min: 11, temperature_max: 16 });
      expect(result[2]).toEqual({ date: '2024-01-03', temperature_min: 12, temperature_max: 17 });
    });
  });

  describe('getTotalPrecipitation', () => {
    it('should return 0 when item is null', () => {
      component.item = null;
      expect(component.getTotalPrecipitation()).toBe(0);
    });

    it('should return 0 when daily precipitation_sum is missing', () => {
      component.item = { city: 'Rennes', data: {} };
      expect(component.getTotalPrecipitation()).toBe(0);
    });

    it('should sum all precipitation values', () => {
      component.item = {
        city: 'Rennes',
        data: {
          daily: {
            precipitation_sum: [10, 5, 15, 20],
          },
        },
      };
      expect(component.getTotalPrecipitation()).toBe(50);
    });
  });

  describe('closeHistoryModal', () => {
    it('should reset precipitation history modal state', () => {
      component.showHistoryModal = true;
      component.precipitationHistory = [{ date: '2024-01-01', precipitation: 10, cumulative: 10 }];
      component.selectedCityForHistory = 'Rennes';
      component.isLoadingPrecipitationHistory = true;

      component.closeHistoryModal();

      expect(component.showHistoryModal).toBe(false);
      expect(component.precipitationHistory).toEqual([]);
      expect(component.selectedCityForHistory).toBe('');
      expect(component.isLoadingPrecipitationHistory).toBe(false);
    });
  });

  describe('closeTemperatureHistoryModal', () => {
    it('should reset temperature history modal state', () => {
      component.showTemperatureHistoryModal = true;
      component.temperatureHistory = [{ date: '2024-01-01', temperature_min: 10, temperature_max: 15 }];
      component.selectedCityForHistory = 'Rennes';
      component.isLoadingTemperatureHistory = true;

      component.closeTemperatureHistoryModal();

      expect(component.showTemperatureHistoryModal).toBe(false);
      expect(component.temperatureHistory).toEqual([]);
      expect(component.selectedCityForHistory).toBe('');
      expect(component.isLoadingTemperatureHistory).toBe(false);
    });
  });
});
