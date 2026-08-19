import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { PLATFORM_ID } from '@angular/core';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    localStorage.clear();
    document.body.classList.remove('light-theme', 'dark-theme');
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.body.classList.remove('light-theme', 'dark-theme');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with system theme when no saved theme exists', () => {
    expect(service.getCurrentTheme()).toBe('light');
  });

  it('should load saved theme from localStorage', () => {
    // Set theme in localStorage before service is created
    localStorage.setItem('theme', 'dark');
    
    // Recreate TestBed with saved theme
    TestBed.resetTestingModule();
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    
    service = TestBed.inject(ThemeService);
    
    expect(service.getCurrentTheme()).toBe('dark');
  });

  it('should toggle theme from light to dark', () => {
    service.setTheme('light');
    service.toggleTheme();
    expect(service.getCurrentTheme()).toBe('dark');
  });

  it('should toggle theme from dark to light', () => {
    service.setTheme('dark');
    service.toggleTheme();
    expect(service.getCurrentTheme()).toBe('light');
  });

  it('should set theme explicitly', () => {
    service.setTheme('dark');
    expect(service.getCurrentTheme()).toBe('dark');
    
    service.setTheme('light');
    expect(service.getCurrentTheme()).toBe('light');
  });
});
