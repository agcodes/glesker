import { TestBed } from '@angular/core/testing';
import { MapService } from './map.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('MapService', () => {
  let service: MapService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MapService,
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(MapService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('searchCity', () => {
    it('should make GET request to Nominatim API with correct parameters', () => {
      const cityName = 'Rennes';
      const mockResponse = [
        {
          addresstype: 'city',
          display_name: 'Rennes, Ille-et-Vilaine, Bretagne, France',
          lat: '48.1147',
          lon: '-1.6794',
          address: {
            city: 'Rennes',
            country: 'France',
          },
        },
      ];

      service.searchCity(cityName).subscribe((results) => {
        expect(results).toHaveLength(1);
        expect(results[0].display_name).toBe('Rennes, Ille-et-Vilaine, Bretagne, France');
        expect(results[0].lat).toBe('48.1147');
        expect(results[0].lon).toBe('-1.6794');
      });

      const req = httpMock.expectOne(
        (request) => request.urlWithParams.includes('nominatim.openstreetmap.org/search')
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('q')).toBe(cityName);
      expect(req.request.params.get('format')).toBe('json');
      expect(req.request.params.get('limit')).toBe('10');
      expect(req.request.headers.has('User-Agent')).toBeTruthy();
      expect(req.request.headers.get('User-Agent')).toBe('GleskerApp');
      req.flush(mockResponse);
    });

    it('should filter results to only include cities, towns, and villages', () => {
      const cityName = 'Paris';
      const mockResponse = [
        {
          addresstype: 'city',
          display_name: 'Paris, France',
          lat: '48.8566',
          lon: '2.3522',
          address: { city: 'Paris' },
        },
        {
          addresstype: 'town',
          display_name: 'Paris, Texas, USA',
          lat: '33.6605',
          lon: '-95.5558',
          address: { town: 'Paris' },
        },
        {
          addresstype: 'village',
          display_name: 'Paris, Ontario, Canada',
          lat: '43.1972',
          lon: '-80.3936',
          address: { village: 'Paris' },
        },
        {
          addresstype: 'hamlet',
          display_name: 'Paris, Kentucky, USA',
          lat: '38.2087',
          lon: '-84.2527',
          address: { hamlet: 'Paris' },
        },
      ];

      service.searchCity(cityName).subscribe((results) => {
        expect(results).toHaveLength(3);
        expect(results.map(r => r.display_name)).toEqual([
          'Paris, France',
          'Paris, Texas, USA',
          'Paris, Ontario, Canada'
        ]);
      });

      const req = httpMock.expectOne(
        (request) => request.urlWithParams.includes('nominatim.openstreetmap.org/search')
      );
      req.flush(mockResponse);
    });

    it('should return empty array when no results match filter criteria', () => {
      const cityName = 'Nowhere';
      const mockResponse = [
        {
          addresstype: 'hamlet',
          display_name: 'Nowhere, USA',
          lat: '0',
          lon: '0',
          address: { hamlet: 'Nowhere' },
        },
      ];

      service.searchCity(cityName).subscribe((results) => {
        expect(results).toHaveLength(0);
      });

      const req = httpMock.expectOne(
        (request) => request.urlWithParams.includes('nominatim.openstreetmap.org/search')
      );
      req.flush(mockResponse);
    });

    it('should handle empty response', () => {
      const cityName = 'NonexistentCity';
      const mockResponse: any[] = [];

      service.searchCity(cityName).subscribe((results) => {
        expect(results).toHaveLength(0);
      });

      const req = httpMock.expectOne(
        (request) => request.urlWithParams.includes('nominatim.openstreetmap.org/search')
      );
      req.flush(mockResponse);
    });

    it('should map response to GeoLocation format', () => {
      const cityName = 'Brest';
      const mockResponse = [
        {
          addresstype: 'city',
          display_name: 'Brest, Finistère, Bretagne, France',
          lat: '48.3858',
          lon: '-4.4891',
          address: {
            city: 'Brest',
            state: 'Finistère',
            country: 'France',
          },
        },
      ];

      service.searchCity(cityName).subscribe((results) => {
        expect(results).toHaveLength(1);
        const result = results[0];
        expect(result.display_name).toBe('Brest, Finistère, Bretagne, France');
        expect(result.lat).toBe('48.3858');
        expect(result.lon).toBe('-4.4891');
      });

      const req = httpMock.expectOne(
        (request) => request.urlWithParams.includes('nominatim.openstreetmap.org/search')
      );
      req.flush(mockResponse);
    });
  });
});
