import { TestBed } from '@angular/core/testing';
import { WeatherService } from './weather.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        WeatherService,
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(WeatherService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCities', () => {
    it('should return empty array when no cities saved', () => {
      expect(service.getCities()).toEqual([]);
    });

    it('should return saved cities', () => {
      const cities = [
        { name: 'Rennes', latitude: 48.1147, longitude: -1.6794 },
        { name: 'Brest', latitude: 48.3858, longitude: -4.4891 },
      ];
      localStorage.setItem('glesker_saved_cities', JSON.stringify(cities));
      
      // Recreate service to load from localStorage - need to recreate TestBed
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          WeatherService,
          provideHttpClientTesting(),
        ],
      });
      service = TestBed.inject(WeatherService);
      
      expect(service.getCities()).toEqual(cities);
    });
  });

  describe('addCityByName', () => {
    it('should add new city', () => {
      service.addCityByName('Rennes', 48.1147, -1.6794);
      const cities = service.getCities();
      
      expect(cities).toHaveLength(1);
      expect(cities[0].name).toBe('Rennes');
      expect(cities[0].latitude).toBe(48.1147);
      expect(cities[0].longitude).toBe(-1.6794);
    });

    it('should not add duplicate city (case insensitive)', () => {
      service.addCityByName('Rennes', 48.1147, -1.6794);
      service.addCityByName('rennes', 48.1147, -1.6794);
      
      const cities = service.getCities();
      expect(cities).toHaveLength(1);
    });

    it('should limit to 4 cities maximum', () => {
      service.addCityByName('City1', 0, 0);
      service.addCityByName('City2', 0, 0);
      service.addCityByName('City3', 0, 0);
      service.addCityByName('City4', 0, 0);
      service.addCityByName('City5', 0, 0);
      
      const cities = service.getCities();
      expect(cities).toHaveLength(4);
      expect(cities.map(c => c.name)).toEqual(['City1', 'City2', 'City3', 'City4']);
    });
  });

  describe('removeCity', () => {
    it('should remove city by name', () => {
      service.addCityByName('Rennes', 48.1147, -1.6794);
      service.addCityByName('Brest', 48.3858, -4.4891);
      
      service.removeCity('Rennes');
      
      const cities = service.getCities();
      expect(cities).toHaveLength(1);
      expect(cities[0].name).toBe('Brest');
    });

    it('should do nothing if city not found', () => {
      service.addCityByName('Rennes', 48.1147, -1.6794);
      service.removeCity('Paris');
      
      const cities = service.getCities();
      expect(cities).toHaveLength(1);
      expect(cities[0].name).toBe('Rennes');
    });
  });

  describe('addCurrentLocation', () => {
    it('should add current location as first city', () => {
      service.addCityByName('Rennes', 48.1147, -1.6794);
      service.addCurrentLocation(48.3858, -4.4891);
      
      const cities = service.getCities();
      expect(cities).toHaveLength(2);
      expect(cities[0].name).toBe('Ma position');
      expect(cities[0].latitude).toBe(48.3858);
      expect(cities[0].longitude).toBe(-4.4891);
    });

    it('should replace existing Ma position', () => {
      service.addCurrentLocation(48.1147, -1.6794);
      service.addCurrentLocation(48.3858, -4.4891);
      
      const cities = service.getCities();
      expect(cities).toHaveLength(1);
      expect(cities[0].latitude).toBe(48.3858);
      expect(cities[0].longitude).toBe(-4.4891);
    });

    it('should limit to 4 cities including current location', () => {
      service.addCityByName('City1', 0, 0);
      service.addCityByName('City2', 0, 0);
      service.addCityByName('City3', 0, 0);
      service.addCurrentLocation(48.3858, -4.4891);
      service.addCityByName('City4', 0, 0);
      service.addCityByName('City5', 0, 0);
      
      const cities = service.getCities();
      expect(cities).toHaveLength(4);
    });
  });

  describe('getWeatherDescription', () => {
    it('should return correct description for weather code 0', () => {
      expect(service.getWeatherDescription(0)).toBe('Ciel dégagé');
    });

    it('should return correct description for weather code 61', () => {
      expect(service.getWeatherDescription(61)).toBe('Pluie légère');
    });

    it('should return correct description for weather code 95', () => {
      expect(service.getWeatherDescription(95)).toBe('Orage');
    });

    it('should return Inconnu for unknown code', () => {
      expect(service.getWeatherDescription(999)).toBe('Inconnu');
    });
  });

  describe('getWeatherIcon', () => {
    it('should return sun emoji for clear sky', () => {
      expect(service.getWeatherIcon(0)).toBe('☀️');
      expect(service.getWeatherIcon(1)).toBe('☀️');
    });

    it('should return partly cloudy emoji for partly cloudy', () => {
      expect(service.getWeatherIcon(2)).toBe('⛅');
      expect(service.getWeatherIcon(3)).toBe('⛅');
    });

    it('should return fog emoji for fog', () => {
      expect(service.getWeatherIcon(45)).toBe('🌫️');
      expect(service.getWeatherIcon(48)).toBe('🌫️');
    });

    it('should return rain emoji for rain', () => {
      expect(service.getWeatherIcon(61)).toBe('🌧️');
      expect(service.getWeatherIcon(65)).toBe('🌧️');
    });

    it('should return snow emoji for snow', () => {
      expect(service.getWeatherIcon(71)).toBe('❄️');
      expect(service.getWeatherIcon(77)).toBe('❄️');
    });

    it('should return thunder emoji for thunderstorm', () => {
      expect(service.getWeatherIcon(95)).toBe('⛈️');
      expect(service.getWeatherIcon(99)).toBe('⛈️');
    });

    it('should return globe emoji for unknown code', () => {
      expect(service.getWeatherIcon(999)).toBe('🌍');
    });
  });

  describe('HTTP requests', () => {
    it('should make GET request for searchCity', () => {
      const mockCityName = 'Rennes';
      const mockResponse = [
        {
          display_name: 'Rennes, Bretagne, France',
          lat: '48.1147',
          lon: '-1.6794',
        },
      ];

      service.searchCity(mockCityName).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        (request) => request.url === 'https://nominatim.openstreetmap.org/search' && 
                     request.params.has('q') && 
                     request.params.get('q') === 'Rennes, France'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should make GET request for getWeatherByCoordinates', () => {
      const lat = 48.1147;
      const lon = -1.6794;
      const mockResponse = {
        latitude: lat,
        longitude: lon,
        current_weather: {
          temperature: 15,
          windspeed: 10,
          winddirection: 180,
          weathercode: 0,
          time: '2024-01-01T12:00:00Z',
        },
      };

      service.getWeatherByCoordinates(lat, lon).subscribe((response) => {
        expect(response.current_weather.temperature).toBe(15);
      });

      const req = httpMock.expectOne(
        (request) => request.url === 'https://api.open-meteo.com/v1/forecast' && 
                     request.params.has('latitude') && 
                     request.params.get('latitude') === String(lat)
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
