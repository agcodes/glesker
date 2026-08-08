import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-temperature-history-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './temperature-history-modal.component.html',
  styleUrl: './temperature-history-modal.component.css'
})
export class TemperatureHistoryModalComponent implements AfterViewInit, OnChanges {
  @Input() cityName: string = '';
  @Input() historyData: { date: string; 
    temperature_max: number; 
    temperature_min: number }[] = [];
  @Input() isLoading: boolean = false;
  
  private todayDate: string = new Date().toISOString().split('T')[0];

  @Output() modalClosed = new EventEmitter<void>();

  // Créer un plugin personnalisé pour la ligne verticale "Aujourd'hui"
  private createVerticalLinePlugin(date: string) {
    return {
      id: 'verticalLine',
      afterDraw: (chart: any) => {
        const { ctx, chartArea: { top, bottom, left, right }, scales: { x } } = chart;
        const xPos = x.getPixelForValue(date);

        if (xPos === undefined || xPos < left || xPos > right) return;

        // Ligne verticale en pointillés
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xPos, top);
        ctx.lineTo(xPos, bottom);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.restore();

        // Label "Aujourd'hui"
        ctx.save();
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const label = 'Aujourd\'hui';
        const textWidth = ctx.measureText(label).width;

        // Fond du label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(
          xPos - textWidth / 2 - 8,
          top - 28,
          textWidth + 16,
          20
        );

        // Texte
        ctx.fillStyle = '#fff';
        ctx.fillText(label, xPos, top - 15);
        ctx.restore();
      }
    };
  }

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

    // Register the vertical line plugin with today's date
    Chart.register(this.createVerticalLinePlugin(this.todayDate));

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.historyData.map(d => d.date),
        datasets: [
          {
            label: 'Température max',
            data: this.historyData.map(d => d.temperature_max),
            borderColor: '#e81a1a',
            backgroundColor: 'rgba(232, 26, 26, 0.1)',
            tension: 0.1,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#e81a1a'
          },
          {
            label: 'Température min',
            data: this.historyData.map(d => d.temperature_min),
            borderColor: '#1a73e8',
            backgroundColor: 'rgba(26, 115, 232, 0.1)',
            tension: 0.1,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#1a73e8'
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
                return `${context.dataset.label}: ${context.raw}`;
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
              maxRotation: 190,
              minRotation: 0
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Température'
            }
          }
        }
      }
    });
  }

  // Méthode de formatage délégée à WeatherUtils
  formatNumber = (value: any, decimals: number = 1): string => {
    if (value == null) return '0';
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    const multiplier = Math.pow(10, decimals);
    const rounded = Math.round(num * multiplier) / multiplier;
    return decimals === 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
  };
}
