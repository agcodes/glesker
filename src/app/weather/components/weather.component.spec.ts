import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeatherComponent } from './weather.component';
import { WeatherService } from '../services/weather.service';
import { MapService } from '../services/map.service';
import { ThemeService } from '../../theme.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeatherCardComponent } from './weather-card.component';
import { of, throwError, Subscription } from 'rxjs';

describe('WeatherComponent', () => {
  let component: WeatherComponent;
  let fixture: ComponentFixture<WeatherComponent>;
  let weatherServiceMock: any;
  let mapServiceMock: any;
  let themeServiceMock: any;

  const mockWeatherData = [
    {
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
          time: ['2024-01-01', '2024-01-02'],
          weathercode: [0, 1],
          temperature_2m_max: [15, 16],
          temperature_2m_min: [10, 11],
          precipitation_sum: [5, 10],
          showers_sum: [2, 3],
          precipitation_probability_max: [20, 30],
          windspeed_10m_max: [15, 20],
          precipitation_hours: [3, 4],
        },
        daily_units: {
          windspeed_10m_max: 'km/h',
          precipitation_sum: 'mm',
          showers_sum: 'mm',
          precipitation_hours: 'h',
        },
      },
    },
  ];

  beforeEach(async () => {
    weatherServiceMock = {
      cities: [],
      getCities: vi.fn().mockReturnValue([]),
      addCurrentLocation: vi.fn(),
      addCityByName: vi.fn(),
      removeCity: vi.fn(),
      getWeather: vi.fn().mockReturnValue(of(mockWeatherData)),
      getWeatherByCoordinates: vi.fn().mockReturnValue(of({})),
      getWeatherIcon: (code: number) => '☀️',
      getWeatherDescription: (code: number) => 'Ciel dégagé',
    };

    mapServiceMock = {
      searchCity: vi.fn().mockReturnValue(of([])),
    };

    themeServiceMock = {
      theme: vi.fn(() => 'light'),
      getCurrentTheme: vi.fn(() => 'light'),
      toggleTheme: vi.fn(),
      setTheme: vi.fn(),
      useSystem: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FormsModule, WeatherCardComponent],
      providers: [
        { provide: WeatherService, useValue: weatherServiceMock },
        { provide: MapService, useValue: mapServiceMock },
        { provide: ThemeService, useValue: themeServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges yet to check initial state
  });

  afterEach(() => {
    if (component['autoRefreshSubscription']) {
      component['autoRefreshSubscription'].unsubscribe();
    }
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    // Check initial state before ngOnInit
    expect(component.weatherData).toEqual([]);
    expect(component.isLoading).toBe(true);
    expect(component.noCity).toBe(true);
    expect(component.isSearching).toBe(false);
    expect(component.error).toBeNull();
    expect(component.searchError).toBeNull();
    expect(component.searchQuery).toBe('');
    expect(component.searchResults).toEqual([]);
    expect(component.showSearchResults).toBe(false);
  });

  describe('ngOnInit', () => {
    it('should call getLocationThenLoadWeather on init', () => {
      const spy = vi.spyOn(component, 'getLocationThenLoadWeather');
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getLocationThenLoadWeather', () => {
    it('should call loadWeather', () => {
      const spy = vi.spyOn(component, 'loadWeather');
      component.getLocationThenLoadWeather();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('searchPosition', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: PositionCallback, error: PositionErrorCallback) => {
            success({
              coords: { latitude: 48.0, longitude: -1.0 },
              timestamp: Date.now(),
            } as GeolocationPosition);
          },
        },
        configurable: true,
      });
    });

    it('should add current location and load weather on success', () => {
      const weatherSpy = vi.spyOn(weatherServiceMock, 'addCurrentLocation');
      const loadSpy = vi.spyOn(component, 'loadWeather');

      component.searchPosition();

      expect(weatherSpy).toHaveBeenCalledWith(48.0, -1.0);
      expect(component.isSearching).toBe(false);
      expect(component.searchError).toBeNull();
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should handle geolocation error', () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: PositionCallback, error: PositionErrorCallback) => {
            error({ code: 1, message: 'Permission denied' } as GeolocationPositionError);
          },
        },
        configurable: true,
      });

      component.searchPosition();

      expect(component.isSearching).toBe(false);
      expect(component.searchError).toBe('Géolocalisation refusée ou non disponible');
    });

    it('should handle geolocation not available', () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        configurable: true,
      });

      component.searchPosition();

      expect(component.isSearching).toBe(false);
      expect(component.searchError).toBe('Position non disponible');
    });
  });

  describe('searchCity', () => {
    it('should not search when query is empty', () => {
      component.searchQuery = '   ';
      component.searchCity();
      expect(mapServiceMock.searchCity).not.toHaveBeenCalled();
    });

    it('should call mapService.searchCity with query', () => {
      component.searchQuery = 'Rennes';
      component.searchCity();
      expect(mapServiceMock.searchCity).toHaveBeenCalledWith('Rennes');
    });

    it('should handle search results with multiple results', () => {
      const mockResults = [
        { display_name: 'Rennes, France', lat: '48.1147', lon: '-1.6794', address: {} },
        { display_name: 'Rennes, Texas', lat: '33.6605', lon: '-95.5558', address: {} },
      ];
      mapServiceMock.searchCity.mockReturnValueOnce(of(mockResults));

      component.searchQuery = 'Rennes';
      component.searchCity();

      expect(component.isSearching).toBe(false);
      expect(component.searchResults).toEqual(mockResults);
      expect(component.showSearchResults).toBe(true);
      expect(component.searchError).toBe('');
    });

    it('should handle no results', () => {
      mapServiceMock.searchCity.mockReturnValueOnce(of([]));

      component.searchQuery = 'NonexistentCity';
      component.searchCity();

      expect(component.isSearching).toBe(false);
      expect(component.searchError).toBe('Ville non trouvée. Essayez un autre nom.');
    });

    it('should handle search error', () => {
      mapServiceMock.searchCity.mockReturnValueOnce(throwError(() => new Error('Network error')));

      component.searchQuery = 'Rennes';
      component.searchCity();

      expect(component.isSearching).toBe(false);
      expect(component.searchError).toBe('Erreur rencontrée');
    });
  });

  describe('selectCity', () => {
    it('should add city and load weather', () => {
      const city = {
        display_name: 'Rennes, Ille-et-Vilaine, Bretagne, France',
        lat: '48.1147',
        lon: '-1.6794',
        address: {},
      };

      component.selectCity(city);

      expect(weatherServiceMock.addCityByName).toHaveBeenCalledWith('Rennes', 48.1147, -1.6794);
      expect(component.searchQuery).toBe('');
      expect(component.searchResults).toEqual([]);
      expect(component.showSearchResults).toBe(false);
    });
  });

  describe('cancelSelection', () => {
    it('should clear search results and hide them', () => {
      component.searchResults = [{ display_name: 'Rennes', lat: '0', lon: '0', address: {} }];
      component.showSearchResults = true;
      component.searchQuery = 'Rennes';

      component.cancelSelection();

      expect(component.searchResults).toEqual([]);
      expect(component.showSearchResults).toBe(false);
      expect(component.searchQuery).toBe('');
    });
  });

  describe('removeCity', () => {
    it('should call weatherService.removeCity', () => {
      component.removeCity('Rennes');

      expect(weatherServiceMock.removeCity).toHaveBeenCalledWith('Rennes');
    });
  });

  describe('loadWeather', () => {
    it('should set noCity to true when no cities', () => {
      vi.spyOn(weatherServiceMock, 'getCities').mockReturnValueOnce([]);
      vi.spyOn(weatherServiceMock, 'getWeather').mockReturnValueOnce(of([]));

      component.loadWeather();

      expect(component.noCity).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.weatherData).toEqual([]);
    });

    it('should load weather data for cities', () => {
      vi.spyOn(weatherServiceMock, 'getCities').mockReturnValueOnce([
        { name: 'Rennes', latitude: 48.1147, longitude: -1.6794 },
      ]);
      vi.spyOn(weatherServiceMock, 'getWeather').mockReturnValueOnce(of(mockWeatherData));

      component.loadWeather();

      expect(component.noCity).toBe(false);
      expect(component.weatherData).toEqual(mockWeatherData);
      expect(component.isLoading).toBe(false);
    });
  });

  describe('refresh', () => {
    it('should stop auto-refresh and reload weather', () => {
      const stopSpy = vi.spyOn(component as any, 'stopAutoRefresh');
      const loadSpy = vi.spyOn(component, 'loadWeather');

      component.refresh();

      expect(stopSpy).toHaveBeenCalled();
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('updateDayIndex', () => {
    it('should update day index for city', () => {
      component.dayIndexes = {};
      component.updateDayIndex({ city: 'Rennes', newIndex: 5 });
      expect(component.dayIndexes['Rennes']).toBe(5);
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop auto-refresh on destroy', () => {
      component['autoRefreshSubscription'] = new Subscription();
      const stopSpy = vi.spyOn(component as any, 'stopAutoRefresh');

      component.ngOnDestroy();

      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('stopAutoRefresh', () => {
    it('should unsubscribe from auto-refresh subscription', () => {
      const mockSubscription = new Subscription();
      const unsubscribeSpy = vi.spyOn(mockSubscription, 'unsubscribe');
      component['autoRefreshSubscription'] = mockSubscription;

      (component as any).stopAutoRefresh();

      expect(unsubscribeSpy).toHaveBeenCalled();
      expect(component['autoRefreshSubscription']).toBeNull();
    });

    it('should not fail when no subscription exists', () => {
      component['autoRefreshSubscription'] = null;
      expect(() => (component as any).stopAutoRefresh()).not.toThrow();
    });
  });
});
