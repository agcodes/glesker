import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RainHistoryModalComponent } from './rain-history-modal.component';
import { CommonModule } from '@angular/common';
import { WeatherUtils } from '../utils/weather-utils';

describe('RainHistoryModalComponent', () => {
  let component: RainHistoryModalComponent;
  let fixture: ComponentFixture<RainHistoryModalComponent>;

  const mockHistoryData = [
    { date: '2024-01-01', precipitation: 10, cumulative: 10 },
    { date: '2024-01-02', precipitation: 5, cumulative: 15 },
    { date: '2024-01-03', precipitation: 15, cumulative: 30 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RainHistoryModalComponent);
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

  describe('formatNumber method', () => {
    it('should be assigned from WeatherUtils', () => {
      expect(component.formatNumber).toBe(WeatherUtils.formatNumber);
    });

    it('should format numbers correctly', () => {
      expect(component.formatNumber(10.5, 1)).toBe('10.5');
      expect(component.formatNumber(10, 0)).toBe('10');
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
