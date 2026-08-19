import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { App } from './app';
import { WeatherComponent } from './weather/components/weather.component';
import { WeatherCardComponent } from './weather/components/weather-card.component';
import { RainHistoryModalComponent } from './weather/components/rain-history-modal.component';
import { TemperatureHistoryModalComponent } from './weather/components/temperature-history-modal.component';
import { routes } from './app.routes';

@NgModule({
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    HttpClientModule,
    RouterModule.forRoot(routes),
    App,
    WeatherComponent,
    WeatherCardComponent,
    RainHistoryModalComponent,
    TemperatureHistoryModalComponent
  ],
  bootstrap: [App]
})
export class AppModule {}
