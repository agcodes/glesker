import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GeoLocation } from '../models/GeoLocation';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  constructor(private http: HttpClient) {}

  // Rechercher une ville par son nom avec filtre
  searchCity(cityName: string): Observable<GeoLocation[]> {
    const params = {
      format: 'json',
      q: cityName,
      limit: 10,
    };
    const headers = { 'User-Agent': 'GleskerApp' };

    return this.http
      .get<any[]>('https://nominatim.openstreetmap.org/search', { params, headers })
      .pipe(
        map((data) =>
          data
            // Filtre : class = place ET (type = city OU town)
            .filter(
              (item) =>
                item.addresstype === 'town' ||
                item.addresstype === 'city' ||
                item.addresstype === 'village',
            )
            // Mappe vers le format GeoLocation
            .map((item) => ({
              display_name: item.display_name,
              lat: item.lat,
              lon: item.lon,
              address: item.address,
            })),
        ),
      );
  }
}
