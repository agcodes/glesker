import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { WeatherUtils } from '../utils/weather-utils';

Chart.register(...registerables);

@Component({
  selector: 'app-hourly-precipitation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hourly-precipitation-modal.component.html',
  styleUrl: './hourly-precipitation-modal.component.css',
})
export class HourlyPrecipitationModalComponent implements AfterViewInit, OnChanges {
  @Input() cityName: string = '';
  @Input() data: { date: string; precipitation: number; cumulative: number }[] = [];
  @Input() isLoading: boolean = false;

  @Output() modalClosed = new EventEmitter<void>();

  private _showModal: boolean = false;

  @Input()
  set showModal(value: boolean) {
    this._showModal = value;
    if (value && this.data.length > 0) {
      setTimeout(() => this.createChart(), 0);
    }
  }
  get showModal(): boolean {
    return this._showModal;
  }

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  constructor() {}

  ngAfterViewInit(): void {
    if (this._showModal && this.data.length > 0) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this._showModal && changes['data'] && this.data.length > 0) {
      setTimeout(() => this.createChart(), 0);
    }
  }

  closeModal(): void {
    this.modalClosed.emit();
  }

  // Méthode de formatage délégée à WeatherUtils
  formatNumber = WeatherUtils.formatNumber;

  private createChart(): void {
    if (!this.chartCanvas || !this.data.length) {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      return;
    }

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.data.map((d) => d.date),
        datasets: [
          {
            label: 'Précipitations par heure (mm)',
            data: this.data.map((d) => d.precipitation),
            borderColor: '#1a73e8',
            backgroundColor: 'rgba(26, 115, 232, 0.1)',
            tension: 0.1,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#1a73e8',
          },
          {
            label: 'Cumulé (mm)',
            data: this.data.map((d) => d.cumulative),
            borderColor: '#0f9d58',
            backgroundColor: 'rgba(15, 157, 88, 0.1)',
            tension: 0.1,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#0f9d58',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${context.raw} mm`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Heure',
            },
            ticks: {
              maxRotation: 190,
              minRotation: 0,
              callback: (value: string | number) => {
                const str = String(value);
                if (str.includes('T')) {
                  return str.split('T')[1].split(':')[0];
                }
                return str;
              },
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Précipitations (mm)',
            },
          },
        },
      },
    });
  }
}
