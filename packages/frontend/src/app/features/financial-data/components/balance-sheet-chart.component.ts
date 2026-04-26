import {
  Component, input, computed, signal, ElementRef, viewChild,
  afterNextRender, effect, untracked, OnDestroy,
} from '@angular/core';
import type { FinancialData } from '../financial-data.model';
import * as echarts from 'echarts';

@Component({
  selector: 'app-balance-sheet-chart',
  standalone: true,
  template: `
    <div class="bsc-wrap">
      @if (years().length > 1) {
        <div class="year-select">
          <label>Año:</label>
          <select [value]="selectedYear()" (change)="selectedYear.set(+$any($event.target).value)">
            @for (y of years(); track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>
      }
      <div #chartEl class="chart"></div>
    </div>
  `,
  styles: [`
    .bsc-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .year-select {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      label { font-size: 0.85rem; color: var(--p-text-muted-color); }
      select {
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--p-surface-border);
        border-radius: 4px;
        background: var(--p-surface-ground);
        color: var(--p-text-color);
        font-size: 0.85rem;
        cursor: pointer;
      }
    }
    .chart { width: 100%; height: 480px; }
  `],
})
export class BalanceSheetChartComponent implements OnDestroy {
  data  = input.required<FinancialData>();
  years = input.required<number[]>();

  selectedYear = signal(0);

  private chartEl = viewChild.required<ElementRef<HTMLDivElement>>('chartEl');
  private chart: echarts.ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private chartData = computed(() => {
    const ys = this.years();
    const bs = this.data().balance;
    if (!ys.length || !bs.length) return null;

    const year = this.selectedYear() || ys[0];
    const rec  = bs.find(r => r.fiscalYear === year);
    if (!rec) return null;

    const total = rec.totalAssets ?? 0;
    if (!total) return null;

    
    // Assets (bottom → top)
    const cash        = rec.cashAndEquivalents ?? 0;
    const totalCur    = rec.totalCurrentAssets ?? 0;
    const otherCur    = Math.max(0, totalCur - cash);
    const goodwill    = rec.goodwill ?? 0;
    const intangibles = rec.intangibleAssets ?? 0;
    const ppe         = rec.propertyPlantEquipmentNet ?? 0;
    const otherAssets = Math.max(0, total - cash - otherCur - goodwill - intangibles - ppe);
    const totalAssets = cash + totalCur + goodwill + intangibles + ppe + otherAssets;
    
    // Liabilities + Equity (bottom → top)
    const curLiab    = rec.totalCurrentLiabilities ?? 0;
    const nonCurLiab = rec.totalNonCurrentLiabilities ?? 0;
    const equity     = rec.totalEquity ?? 0;
    const totalLiabEq = curLiab + nonCurLiab + equity;
    
    
    const pctAssets = (v: number | null) => v != null ? (v / totalAssets) * 100 : 0;
    const pctLiab = (v: number | null) => v != null ? (v / totalLiabEq) * 100 : 0;

    return {
      year,
      assets: {
        cash:        pctAssets(cash),
        otherCur:    pctAssets(otherCur),
        goodwill:    pctAssets(goodwill),
        intangibles: pctAssets(intangibles),
        ppe:         pctAssets(ppe),
        other:       pctAssets(otherAssets),
      },
      liab: {
        current:    pctLiab(curLiab),
        nonCurrent: pctLiab(nonCurLiab),
        equity:     pctLiab(equity),
      },
    };
  });

  constructor() {
    // Sync selectedYear when years input changes
    effect(() => {
      const ys = this.years();
      if (ys.length) {
        const cur = untracked(() => this.selectedYear());
        if (!ys.includes(cur)) this.selectedYear.set(ys[0]);
      }
    });

    // Init chart after first render
    afterNextRender(() => {
      const el = this.chartEl();
      this.chart = echarts.init(el.nativeElement, null, { renderer: 'canvas' });
      this.resizeObserver = new ResizeObserver(() => this.chart?.resize());
      this.resizeObserver.observe(el.nativeElement.parentElement!);
      this.renderChart();
    });

    // Update chart when data changes
    effect(() => {
      this.chartData();
      if (this.chart) this.renderChart();
    });
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.chart?.dispose();
  }

  private renderChart() {
    if (!this.chart) return;
    const d = this.chartData();
    if (!d) { this.chart.clear(); return; }
    this.chart.setOption(this.buildOption(d), true);
  }

  private buildOption(d: NonNullable<ReturnType<typeof this.chartData>>): echarts.EChartsOption {
    const fmt = (v: number) => `${Math.round(v)}%`;

    const mkSeries = (
      name: string,
      color: string,
      valA: number,
      valB: number,
    ): echarts.BarSeriesOption => ({
      name,
      type: 'bar',
      stack: 'total',
      barWidth: 100,
      itemStyle: { color },
      label: {
        show: true,
        position: 'inside',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        formatter: (p: any) => (p.value as number) > 4 ? fmt(p.value as number) : '',
      },
      data: [valA, valB],
    });

    const hasMiscAssets = d.assets.other > 0.5;

    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => `<b>${p.seriesName}</b><br/>${fmt(p.value as number)}`,
      },
      legend: {
        top: 0,
        left: 'center',
        itemWidth: 14,
        itemHeight: 14,
        textStyle: { fontSize: 11.5 },
        data: [
          'Patrimonio Neto',
          'Pasivo No-Corriente',
          'Pasivo Corriente',
          'Inmovilizado',
          'Otros Intangibles',
          'Goodwill',
          'Otros Activos Corrientes',
          'Caja',
          ...(hasMiscAssets ? ['Otros Activos'] : []),
        ],
      },
      grid: { top: 70, bottom: 50, left: '10%', right: '10%' },
      xAxis: {
        type: 'category',
        data: ['ACTIVOS', 'PASIVOS + PATRIMONIO NETO'],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontWeight: 'bold', fontSize: 12, margin: 14 },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%' },
        splitLine: { lineStyle: { type: 'dashed', color: '#e0e0e0' } },
      },
      series: [
        // ── ACTIVOS (left bar) ───────────────────────────────────────────
        mkSeries('Caja',                    '#cad7af', d.assets.cash,        0),
        mkSeries('Otros Activos Corrientes','#8fad8a', d.assets.otherCur,    0),
        mkSeries('Goodwill',               '#4d8c69', d.assets.goodwill,    0),
        mkSeries('Otros Intangibles',      '#2d6a4a', d.assets.intangibles, 0),
        mkSeries('Inmovilizado',           '#1b3a2d', d.assets.ppe,         0),
        ...(hasMiscAssets
          ? [mkSeries('Otros Activos',     '#3a5c48', d.assets.other,        0)]
          : []
        ),
        // ── PASIVOS + PATRIMONIO NETO (right bar) ────────────────────────
        mkSeries('Pasivo Corriente',       '#cc9090', 0, d.liab.current),
        mkSeries('Pasivo No-Corriente',    '#8c3030', 0, d.liab.nonCurrent),
        mkSeries('Patrimonio Neto',        '#3d1515', 0, d.liab.equity),
      ],
    };
  }
}
