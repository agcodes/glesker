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

Chart.register(...registerables);

@Component({
  selector: 'app-temperature-hourly-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './temperature-hourly-modal.component.html',
  styleUrl: './temperature-hourly-modal.component.css',
})
export class TemperatureHourlyModalComponent implements AfterViewInit, OnChanges {
  @Input() cityName: string = '';
  @Input() hourlyTemperature: { date: string; temperature_max: number; temperature_min: number }[] =
    [];
  @Input() isLoading: boolean = false;

  @Output() modalClosed = new EventEmitter<void>();

  private _showModal: boolean = false;

  @Input()
  set showModal(value: boolean) {
    this._showModal = value;
    if (value && this.hourlyTemperature.length > 0) {
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
    if (this._showModal && this.hourlyTemperature.length > 0) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this._showModal && changes['hourlyTemperature'] && this.hourlyTemperature.length > 0) {
      console.log(this.hourlyTemperature);
      setTimeout(() => this.createChart(), 0);
    }
  }

  closeModal(): void {
    this.modalClosed.emit();
  }

  private createChart(): void {
    console.log('create chart');
    console.log(this.hourlyTemperature);
    if (!this.chartCanvas || !this.hourlyTemperature.length) {
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
        labels: this.hourlyTemperature.map((d) => d.date),
        datasets: [
          {
            label: 'temp. max',
            data: this.hourlyTemperature.map((d) => d.temperature_max),
            borderColor: '#e81a1a',
            backgroundColor: 'rgba(232, 26, 26, 0.1)',
            tension: 0.1,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#e81a1a',
          },
          {
            label: 'temp. min',
            data: this.hourlyTemperature.map((d) => d.temperature_min),
            borderColor: '#1a73e8',
            backgroundColor: 'rgba(26, 115, 232, 0.1)',
            tension: 0.1,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#1a73e8',
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
                return `${context.dataset.label}: ${context.raw}`;
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
                return String(value).split('T')[1].split(':')[0];
              }
            },
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Température',
            },
          },
        },
      },
    });
  }
}
