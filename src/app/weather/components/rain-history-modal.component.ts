import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { WeatherUtils } from '../utils/weather-utils';

Chart.register(...registerables);

@Component({
  selector: 'app-rain-history-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rain-history-modal.component.html',
  styleUrl: './rain-history-modal.component.css',
})
export class RainHistoryModalComponent implements AfterViewInit, OnChanges {
  @Input() cityName: string = '';
  @Input() historyData: { date: string; precipitation: number; cumulative: number }[] = [];
  @Input() isLoading: boolean = false;
  
  @Output() modalClosed = new EventEmitter<void>();
  
  private _showModal: boolean = false;
  
  @Input()
  set showModal(value: boolean) {
    this._showModal = value;
    if (value && this.historyData.length > 0) {
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
    if (this._showModal && this.historyData.length > 0) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this._showModal && changes['historyData'] && this.historyData.length > 0) {
      setTimeout(() => this.createChart(), 0);
    }
  }

  closeModal(): void {
    this.modalClosed.emit();
  }

  // Méthode de formatage délégée à WeatherUtils
  formatNumber = WeatherUtils.formatNumber;

  private createChart(): void {
    if (!this.chartCanvas || !this.historyData.length) {
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
        labels: this.historyData.map(d => d.date),
        datasets: [
          {
            label: 'Précipitations par jour (mm)',
            data: this.historyData.map(d => d.precipitation),
            borderColor: '#1a73e8',
            backgroundColor: 'rgba(26, 115, 232, 0.1)',
            tension: 0.1,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#1a73e8'
          },
          {
            label: 'Cumulé (mm)',
            data: this.historyData.map(d => d.cumulative),
            borderColor: '#0f9d58',
            backgroundColor: 'rgba(15, 157, 88, 0.1)',
            tension: 0.1,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#0f9d58'
          }
        ]
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
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Précipitations (mm)'
            }
          }
        }
      }
    });
  }


}
