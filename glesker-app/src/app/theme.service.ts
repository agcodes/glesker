import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<'light' | 'dark'>('light');
  private platformId = inject(PLATFORM_ID);
  private useSystemTheme = true;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Charger le thème depuis localStorage
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      
      // Si pas de thème sauvegardé, détecter le thème système
      if (savedTheme) {
        this.theme.set(savedTheme);
        this.useSystemTheme = false;
      } else {
        // Utiliser le thème système par défaut
        this.theme.set(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        this.useSystemTheme = true;
      }

      // Mettre à jour la classe du body quand le thème change
      effect(() => {
        const currentTheme = this.theme();
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${currentTheme}-theme`);
        localStorage.setItem('theme', currentTheme);
        this.useSystemTheme = false;
      });

      // Écouter les changements de préférences système
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.useSystemTheme) {
          const systemTheme = e.matches ? 'dark' : 'light';
          this.theme.set(systemTheme);
        }
      });
    }
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.theme();
  }

  toggleTheme(): void {
    const current = this.theme();
    if (current === 'light') {
      this.theme.set('dark');
    } else {
      this.theme.set('light');
    }
    this.useSystemTheme = false;
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.theme.set(theme);
    this.useSystemTheme = false;
  }

  useSystem(): void {
    this.useSystemTheme = true;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    this.theme.set(systemTheme);
  }
}
