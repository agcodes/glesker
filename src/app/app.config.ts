import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { LOCALE_ID } from '@angular/core';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideIonicAngular(),
    {
      provide: LOCALE_ID,
      useFactory: () => {
        // Récupère la langue du navigateur (ex: "fr-FR", "en-US")
        const browserLang = navigator.language;
        // Angular attend un code de locale comme "fr", "en", "es", etc.
        const code: string = browserLang.split('-')[0]; // "fr-FR" → "fr"
        if (code != 'fr' && code != 'en') {
          return 'en';
        }
        return code;
      },
    },
  ],
};
