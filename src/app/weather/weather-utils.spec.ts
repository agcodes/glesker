import { WeatherUtils } from './utils/weather-utils';

describe('WeatherUtils', () => {
  describe('formatDate', () => {
    it('should format valid date string', () => {
      const dateString = '2024-01-15T12:30:00Z';
      const result = WeatherUtils.formatDate(dateString);
      
      expect(result).toContain('15');
      expect(result).toContain('janvier');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty string for undefined input', () => {
      const result = WeatherUtils.formatDate(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for empty string', () => {
      const result = WeatherUtils.formatDate('');
      expect(result).toBe('');
    });
  });

  describe('formatTemperature', () => {
    it('should format positive temperature with Celsius', () => {
      const result = WeatherUtils.formatTemperature(22.5, '°C');
      expect(result).toBe('22.5°C');
    });

    it('should format negative temperature', () => {
      const result = WeatherUtils.formatTemperature(-5.3, '°C');
      expect(result).toBe('-5.3°C');
    });

    it('should format zero temperature', () => {
      const result = WeatherUtils.formatTemperature(0, '°C');
      expect(result).toBe('0°C');
    });

    it('should return empty string for undefined', () => {
      const result = WeatherUtils.formatTemperature(undefined, '°C');
      expect(result).toBe('');
    });

    it('should round to one decimal place', () => {
      const result = WeatherUtils.formatTemperature(22.555, '°C');
      expect(result).toBe('22.6°C');
    });
  });

  describe('getWindDirection', () => {
    it('should return N for 0 degrees', () => {
      expect(WeatherUtils.getWindDirection(0)).toBe('N');
    });

    it('should return E for 90 degrees', () => {
      expect(WeatherUtils.getWindDirection(90)).toBe('E');
    });

    it('should return S for 180 degrees', () => {
      expect(WeatherUtils.getWindDirection(180)).toBe('S');
    });

    it('should return O for 270 degrees', () => {
      expect(WeatherUtils.getWindDirection(270)).toBe('O');
    });

    it('should return NE for 45 degrees', () => {
      expect(WeatherUtils.getWindDirection(45)).toBe('NE');
    });

    it('should return NO for 315 degrees', () => {
      expect(WeatherUtils.getWindDirection(315)).toBe('NO');
    });
  });

  describe('formatNumber', () => {
    it('should format integer with default decimals', () => {
      expect(WeatherUtils.formatNumber(42)).toBe('42.0');
    });

    it('should format float with specified decimals', () => {
      expect(WeatherUtils.formatNumber(3.14159, 2)).toBe('3.14');
    });

    it('should format with zero decimals', () => {
      expect(WeatherUtils.formatNumber(42.4, 0)).toBe('42');
    });

    it('should return 0 for null', () => {
      expect(WeatherUtils.formatNumber(null)).toBe('0');
    });

    it('should return 0 for undefined', () => {
      expect(WeatherUtils.formatNumber(undefined)).toBe('0');
    });

    it('should return 0 for NaN', () => {
      expect(WeatherUtils.formatNumber(NaN)).toBe('0');
    });

    it('should return 0 for non-numeric string', () => {
      expect(WeatherUtils.formatNumber('abc')).toBe('0');
    });
  });

  describe('calculateCumulativePrecipitation', () => {
    it('should return empty array for missing daily data', () => {
      const result = WeatherUtils.calculateCumulativePrecipitation({});
      expect(result).toEqual([]);
    });

    it('should return empty array for missing precipitation_sum', () => {
      const result = WeatherUtils.calculateCumulativePrecipitation({
        time: ['2024-01-01', '2024-01-02'],
      });
      expect(result).toEqual([]);
    });

    it('should calculate cumulative precipitation correctly', () => {
      const daily = {
        time: ['2024-01-01', '2024-01-02', '2024-01-03'],
        precipitation_sum: [10, 5, 15],
      };
      
      const result = WeatherUtils.calculateCumulativePrecipitation(daily);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ date: '2024-01-01', precipitation: 10, cumulative: 10 });
      expect(result[1]).toEqual({ date: '2024-01-02', precipitation: 5, cumulative: 15 });
      expect(result[2]).toEqual({ date: '2024-01-03', precipitation: 15, cumulative: 30 });
    });
  });

  describe('getTemperatureColor', () => {
    it('should return default color for undefined', () => {
      const result = WeatherUtils.getTemperatureColor(undefined);
      expect(result).toBe('#1a73e8');
    });

    it('should return green hue for cold temperatures (-20)', () => {
      const result = WeatherUtils.getTemperatureColor(-20);
      expect(result).toContain('hsl(');
      expect(result).toContain('100%');
      expect(result).toContain('50%)');
    });

    it('should return blue hue for cold temperatures (0)', () => {
      const result = WeatherUtils.getTemperatureColor(0);
      expect(result).toContain('hsl(');
    });

    it('should return yellow/red hue for warm temperatures (25)', () => {
      const result = WeatherUtils.getTemperatureColor(25);
      expect(result).toContain('hsl(');
    });

    it('should return red hue for very hot temperatures (50)', () => {
      const result = WeatherUtils.getTemperatureColor(50);
      expect(result).toBe('hsl(0, 100%, 50%)');
    });

    it('should return red hue for temperatures above 50', () => {
      const result = WeatherUtils.getTemperatureColor(60);
      expect(result).toBe('hsl(0, 100%, 50%)');
    });

    it('should return green hue for temperatures at -20', () => {
      const result = WeatherUtils.getTemperatureColor(-20);
      expect(result).toBe('hsl(180, 100%, 50%)');
    });
  });
});
