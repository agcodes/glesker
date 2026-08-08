import { Routes } from '@angular/router';
import { WeatherComponent } from './weather/components/weather.component';

export const routes: Routes = [
  { path: '', component: WeatherComponent, title: 'Météo' },
  { path: '**', redirectTo: '' }
];
