import {
  Component, input, inject, signal, computed,
  ElementRef, viewChild, afterNextRender, effect, OnDestroy,
} from '@angular/core';
import * as echarts from 'echarts';
import type { Company } from '../../companies/company.model';
import { WeissChartService } from '../weiss-chart.service';
import type { WeissChartData } from '../weiss-chart.model';

@Component({
  selector:   'app-weiss-chart',
  standalone: true,
  template: `
    <section class="weiss-chart-card">
      @if (!company()) {
        <div class="empty-state">
          <i class="pi pi-chart-line"></i>
          <h3>Weiss Chart</h3>
          <p>Select a ticker to start.</p>
        </div>
      } @else {
        <div class="chart-header">
          <div>
            <h3>Weiss Chart - {{ data()?.symbol ?? company()?.ticker }}</h3>
            <p>
              Geraldine Weiss yield bands from {{ data()?.period?.from ?? '...' }} to {{ data()?.period?.to ?? '...' }}
            </p>
          </div>

          @if (valuation(); as v) {
            <div
              class="valuation"
              [class.undervalued]="v.zone === 'undervalued'"
              [class.fair]="v.zone === 'fair'"
              [class.overvalued]="v.zone === 'overvalued'"
            >
              <span class="label">Zone</span>
              <strong>{{ zoneLabel(v.zone) }}</strong>
            </div>
          }
        </div>

        @if (loading()) {
          <div class="state-message">Loading Weiss chart data...</div>
        }

        @if (error()) {
          <div class="state-message error">{{ error() }}</div>
        }

        @if (data(); as d) {
          <div class="metrics-grid">
            <div class="metric">
              <span>Current price</span>
              <strong>{{ money(d.valuation.currentPrice, d.currency) }}</strong>
            </div>
            <div class="metric">
              <span>Current yield</span>
              <strong>{{ pct(d.valuation.currentYield) }}</strong>
            </div>
            <div class="metric">
              <span>Fair price</span>
              <strong>{{ money(d.valuation.currentFairPrice, d.currency) }}</strong>
            </div>
            <div class="metric undervalued">
              <span>Undervalue band</span>
              <strong>{{ money(d.valuation.currentUndervaluePrice, d.currency) }}</strong>
            </div>
            <div class="metric overvalued">
              <span>Overvalue band</span>
              <strong>{{ money(d.valuation.currentOvervaluePrice, d.currency) }}</strong>
            </div>
          </div>
        }

        <div class="chart-frame">
          <div #chartEl class="chart"></div>
        </div>
      }
    </section>
  `,
  styles: [`
    .weiss-chart-card {
      min-height: 24rem;
      border: 1px solid var(--p-surface-border);
      border-radius: 0.75rem;
      background: var(--p-surface-card);
      padding: 1rem;
    }

    .empty-state,
    .state-message {
      min-height: 18rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      color: var(--p-text-muted-color);
      text-align: center;
    }

    .empty-state i {
      font-size: 2rem;
      color: var(--p-primary-color);
    }

    .empty-state h3,
    .chart-header h3 {
      margin: 0;
      color: var(--p-text-color);
      font-size: 1.1rem;
      font-weight: 600;
    }

    .empty-state p,
    .chart-header p {
      margin: 0.25rem 0 0;
      color: var(--p-text-muted-color);
      font-size: 0.85rem;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .valuation {
      min-width: 8.5rem;
      border-radius: 0.75rem;
      padding: 0.65rem 0.8rem;
      text-align: right;
      background: var(--p-surface-ground);
      border: 1px solid var(--p-surface-border);
    }

    .valuation .label {
      display: block;
      font-size: 0.7rem;
      color: var(--p-text-muted-color);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .valuation strong {
      display: block;
      margin-top: 0.2rem;
      font-size: 0.95rem;
    }

    .valuation.undervalued { color: #15803d; }
    .valuation.overvalued  { color: #b91c1c; }
    .valuation.fair        { color: #0369a1; }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .metric {
      border: 1px solid var(--p-surface-border);
      border-radius: 0.65rem;
      background: var(--p-surface-ground);
      padding: 0.75rem;
    }

    .metric span {
      display: block;
      color: var(--p-text-muted-color);
      font-size: 0.75rem;
      margin-bottom: 0.3rem;
    }

    .metric strong {
      color: var(--p-text-color);
      font-size: 1rem;
    }

    .metric.undervalued strong { color: #15803d; }
    .metric.overvalued strong  { color: #b91c1c; }

    .state-message {
      min-height: 5rem;
      font-size: 0.9rem;
    }

    .state-message.error {
      color: #b91c1c;
    }

    .chart {
      width: 100%;
      height: 520px;
    }

    .chart-frame {
      border: 1px solid var(--p-surface-border);
      border-radius: 0.75rem;
      background: var(--p-surface-0);
      padding: 0.75rem;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
    }

    @media (max-width: 900px) {
      .chart-header { flex-direction: column; }
      .valuation { text-align: left; }
      .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `],
})
export class WeissChartComponent implements OnDestroy {
  private weissChartSvc = inject(WeissChartService);

  company = input<Company | null>(null);

  data = signal<WeissChartData | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  valuation = computed(() => this.data()?.valuation ?? null);

  private chartEl = viewChild<ElementRef<HTMLDivElement>>('chartEl');
  private chart: echarts.ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private requestId = 0;

  constructor() {
    afterNextRender(() => this.initChart());

    effect(() => {
      const company = this.company();
      if (!company) {
        this.data.set(null);
        this.error.set(null);
        this.chart?.clear();
        return;
      }
      void this.loadData(company.ticker);
    });

    effect(() => {
      this.data();
      this.renderChart();
    });
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.chart?.dispose();
  }

  async loadData(ticker: string) {
    const id = ++this.requestId;
    this.loading.set(true);
    this.error.set(null);
    this.data.set(null);

    try {
      const data = await this.weissChartSvc.getWeissChart(ticker);
      if (id === this.requestId) this.data.set(data);
    } catch (err: any) {
      if (id === this.requestId) {
        this.error.set(err?.error?.message ?? err?.message ?? 'Could not load Weiss chart data');
      }
    } finally {
      if (id === this.requestId) this.loading.set(false);
    }
  }

  money(value: number | null | undefined, currency: string | null | undefined) {
    if (value == null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency ?? 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  }

  pct(value: number | null | undefined) {
    if (value == null) return '-';
    return `${(value * 100).toFixed(2)}%`;
  }

  zoneLabel(zone: string) {
    if (zone === 'undervalued') return 'Undervalued';
    if (zone === 'overvalued') return 'Overvalued';
    if (zone === 'fair') return 'Fair value';
    return 'Unknown';
  }

  private initChart() {
    const el = this.chartEl();
    if (!el || this.chart) return;
    this.chart = echarts.init(el.nativeElement, null, { renderer: 'canvas' });
    this.resizeObserver = new ResizeObserver(() => this.chart?.resize());
    this.resizeObserver.observe(el.nativeElement.parentElement!);
    this.renderChart();
  }

  private renderChart() {
    const el = this.chartEl();
    if (!this.chart && el) this.initChart();
    if (!this.chart) return;

    const data = this.data();
    if (!data) {
      this.chart.clear();
      return;
    }

    this.chart.setOption(this.buildOption(data), true);
    this.chart.resize();
  }

  private buildOption(data: WeissChartData): echarts.EChartsOption {
    const symbol = this.company()?.ticker ?? data.symbol;
    const close = this.lineData(data.series, 'close');
    const fair = this.lineData(data.series, 'fairPrice');
    const undervalue = this.lineData(data.series, 'undervaluePrice');
    const overvalue = this.lineData(data.series, 'overvaluePrice');

    return {
      backgroundColor: '#ffffff',
      title: {
        text: `Geraldine Weiss of ${symbol}`,
        left: 'center',
        top: 8,
        textStyle: {
          color: '#202124',
          fontSize: 22,
          fontWeight: 500,
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const rows = (params as any[]).map((p: any) => {
            const rawValue = Array.isArray(p.value) ? p.value[1] : p.value;
            if (rawValue == null) return '';
            const value = this.money(Number(rawValue), data.currency);
            return `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:4px"></span>${p.seriesName}: <b>${value}</b>`;
          }).filter(Boolean);
          return `<b>${(params as any[])[0]?.axisValueLabel}</b><br/>${rows.join('<br/>')}`;
        },
      },
      grid: { top: 72, left: 72, right: 96, bottom: 54 },
      xAxis: {
        type: 'time',
        boundaryGap: ['0%', '0%'],
        axisLabel: { color: '#202124' },
        axisLine: { lineStyle: { color: '#424242' } },
        axisTick: { lineStyle: { color: '#424242' } },
        splitLine: { show: true, lineStyle: { color: '#c6c6c6', width: 1 } },
      },
      yAxis: {
        type: 'value',
        name: 'Close Price',
        nameLocation: 'middle',
        nameGap: 48,
        nameTextStyle: { color: '#202124', fontSize: 14 },
        axisLabel: { color: '#202124' },
        axisLine: { show: true, lineStyle: { color: '#424242' } },
        axisTick: { show: true, lineStyle: { color: '#424242' } },
        splitLine: { lineStyle: { color: '#c6c6c6', width: 1 } },
      },
      series: [
        {
          name: 'Close Price',
          type: 'line',
          showSymbol: false,
          connectNulls: false,
          lineStyle: { width: 2.2, color: '#2f6fa9' },
          itemStyle: { color: '#2f6fa9' },
          endLabel: this.endLabel('#1d4ed8'),
          labelLayout: { moveOverlap: 'shiftY' },
          data: close,
          z: 3,
        },
        {
          name: 'Fair Price',
          type: 'line',
          step: 'end',
          showSymbol: false,
          connectNulls: true,
          lineStyle: { width: 2, color: '#facc15' },
          itemStyle: { color: '#facc15' },
          endLabel: this.endLabel('#ca8a04'),
          labelLayout: { moveOverlap: 'shiftY' },
          data: fair,
          z: 1,
        },
        {
          name: 'Overvalue Band',
          type: 'line',
          step: 'end',
          showSymbol: false,
          connectNulls: true,
          lineStyle: { width: 2.4, color: '#ef4444' },
          itemStyle: { color: '#ef4444' },
          endLabel: this.endLabel('#ef4444'),
          labelLayout: { moveOverlap: 'shiftY' },
          data: overvalue,
          z: 2,
        },
        {
          name: 'Undervalue Band',
          type: 'line',
          step: 'end',
          showSymbol: false,
          connectNulls: true,
          lineStyle: { width: 2.4, color: '#2f8f2f' },
          itemStyle: { color: '#2f8f2f' },
          endLabel: this.endLabel('#2f8f2f'),
          labelLayout: { moveOverlap: 'shiftY' },
          data: undervalue,
          z: 2,
        },
      ],
    };
  }

  private lineData(
    series: WeissChartData['series'],
    key: 'close' | 'fairPrice' | 'undervaluePrice' | 'overvaluePrice'
  ) {
    return series.map(p => [
      p.date,
      p[key] != null ? +p[key].toFixed(2) : null,
    ]);
  }


  private endLabel(color: string) {
    return {
      show: true,
      color,
      fontSize: 15,
      fontWeight: 700,
      formatter: (params: any) => {
        const value = Array.isArray(params.value) ? params.value[1] : params.value;
        return value == null ? '' : Number(value).toFixed(2);
      },
    };
  }
}
