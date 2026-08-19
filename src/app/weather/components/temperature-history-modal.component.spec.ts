import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemperatureHistoryModalComponent } from './temperature-history-modal.component';
import { CommonModule } from '@angular/common';

describe('TemperatureHistoryModalComponent', () => {
  let component: TemperatureHistoryModalComponent;
  let fixture: ComponentFixture<TemperatureHistoryModalComponent>;

  const mockHistoryData = [
    { date: '2024-01-01', temperature_max: 15, temperature_min: 10 },
    { date: '2024-01-02', temperature_max: 16, temperature_min: 11 },
    { date: '2024-01-03', temperature_max: 17, temperature_min: 12 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TemperatureHistoryModalComponent);
    component = fixture.componentInstance;
    component.cityName = 'Rennes';
    component.historyData = mockHistoryData;
    component.isLoading = false;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.cityName).toBe('Rennes');
    expect(component.historyData).toEqual(mockHistoryData);
    expect(component.isLoading).toBe(false);
    expect(component.showModal).toBe(false);
  });

  it('should have todayDate set to current date in YYYY-MM-DD format', () => {
    const expectedDate = new Date().toISOString().split('T')[0];
    expect(component['todayDate']).toBe(expectedDate);
  });

  describe('Input/Output', () => {
    it('should have cityName input', () => {
      expect(component.cityName).toBe('Rennes');
    });

    it('should have historyData input', () => {
      expect(component.historyData).toEqual(mockHistoryData);
    });

    it('should have isLoading input', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should have showModal input with getter and setter', () => {
      expect(component.showModal).toBe(false);
      component.showModal = true;
      expect(component.showModal).toBe(true);
    });

    it('should have modalClosed output', () => {
      expect(component.modalClosed).toBeDefined();
    });
  });

  describe('showModal setter', () => {
    it('should set _showModal to true', () => {
      component.showModal = true;
      expect(component['_showModal']).toBe(true);
    });

    it('should set _showModal to false', () => {
      component.showModal = false;
      expect(component['_showModal']).toBe(false);
    });
  });

  describe('closeModal', () => {
    it('should emit modalClosed event', () => {
      const emitSpy = vi.spyOn(component.modalClosed, 'emit');
      component.closeModal();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('createVerticalLinePlugin', () => {
    it('should create a plugin with correct id', () => {
      const plugin = (component as any).createVerticalLinePlugin('2024-01-01');
      expect(plugin.id).toBe('verticalLine');
    });

    it('should create a plugin with afterDraw method', () => {
      const plugin = (component as any).createVerticalLinePlugin('2024-01-01');
      expect(typeof plugin.afterDraw).toBe('function');
    });
  });

  describe('formatNumber method', () => {
    it('should format numbers correctly', () => {
      expect(component.formatNumber(10.5, 1)).toBe('10.5');
      expect(component.formatNumber(10, 0)).toBe('10');
      expect(component.formatNumber(null)).toBe('0');
      expect(component.formatNumber(undefined)).toBe('0');
      expect(component.formatNumber(NaN)).toBe('0');
      expect(component.formatNumber('abc')).toBe('0');
    });

    it('should format with specified decimals', () => {
      expect(component.formatNumber(3.14159, 2)).toBe('3.14');
      expect(component.formatNumber(3.14159, 3)).toBe('3.142');
    });
  });

  describe('ngAfterViewInit', () => {
    it('should call createChart when showModal is true and historyData exists', () => {
      component['_showModal'] = true;
      component['historyData'] = mockHistoryData;
      const spy = vi.spyOn(component as any, 'createChart');

      component.ngAfterViewInit();

      expect(spy).toHaveBeenCalled();
    });

    it('should not call createChart when showModal is false', () => {
      component['_showModal'] = false;
      const spy = vi.spyOn(component as any, 'createChart');

      component.ngAfterViewInit();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call createChart when historyData is empty', () => {
      component['_showModal'] = true;
      component['historyData'] = [];
      const spy = vi.spyOn(component as any, 'createChart');

      component.ngAfterViewInit();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should not throw when historyData changes', () => {
      component['_showModal'] = true;
      const changes = {
        historyData: {
          currentValue: mockHistoryData,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      };

      // ngOnChanges uses setTimeout, so we just verify it doesn't throw
      expect(() => component.ngOnChanges(changes as any)).not.toThrow();
    });

    it('should not call createChart when showModal is false', () => {
      component['_showModal'] = false;
      const changes = {
        historyData: {
          currentValue: mockHistoryData,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      };

      const spy = vi.spyOn(component as any, 'createChart');

      component.ngOnChanges(changes as any);

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
