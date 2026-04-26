import {
  Component, input, computed,
  ElementRef, viewChild, afterNextRender, effect, OnDestroy,
} from '@angular/core';
import type { FinancialData } from '../financial-data.model';
import * as echarts from 'echarts';

@Component({
  selector: 'app-dividend-chart',
  standalone: true,
  template: `<div #chartEl class="chart"></div>`,
  styles: [`:host { display: block; } .chart { width: 100%; height: 380px; margin-top: 2rem; }`],
})
export class DividendChartComponent implements OnDestroy {
  data  = input.required<FinancialData>();
  years = input.required<number[]>();

  private chartEl = viewChild.required<ElementRef<HTMLDivElement>>('chartEl');
  private chart: echarts.ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;

  private chartData = computed(() => {
    const ys = [...this.years()].sort((a, b) => a - b);
    const income   = this.data().income;
    const cashflow = this.data().cashflow;
    if (!ys.length) return null;

    const points = ys.map(year => {
      const inc = income.find(r => r.fiscalYear === year);
      const cf  = cashflow.find(r => r.fiscalYear === year);

      const bpa    = inc ? parseFloat(inc.epsBasic ?? '') : NaN;
      const divPaid = cf?.dividendsPaid ?? null;
      const shares  = inc?.sharesBasic  ?? null;
      const dpa    = divPaid != null && shares ? Math.abs(divPaid) / shares : NaN;
      const payout = !isNaN(bpa) && bpa > 0 && !isNaN(dpa) ? (dpa / bpa) * 100 : NaN;

      return {
        year,
        bpa:    isNaN(bpa)    ? null : bpa,
        dpa:    isNaN(dpa)    ? null : dpa,
        payout: isNaN(payout) ? null : payout,
      };
    });

    const hasData = points.some(p => p.bpa != null || p.dpa != null);
    return hasData ? { points } : null;
  });

  constructor() {
    afterNextRender(() => {
      const el = this.chartEl();
      this.chart = echarts.init(el.nativeElement, null, { renderer: 'canvas' });
      this.resizeObserver = new ResizeObserver(() => this.chart?.resize());
      this.resizeObserver.observe(el.nativeElement.parentElement!);
      this.intersectionObserver = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          this.chart?.resize();
          this.renderChart();
        }
      });
      this.intersectionObserver.observe(el.nativeElement);
      this.renderChart();
    });

    effect(() => {
      this.chartData();
      if (this.chart) this.renderChart();
    });
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.chart?.dispose();
  }

  private renderChart() {
    if (!this.chart) return;
    const d = this.chartData();
    if (!d) { this.chart.clear(); return; }
    this.chart.setOption(this.buildOption(d), true);
    this.chart.resize();
  }

  private buildOption(d: NonNullable<ReturnType<typeof this.chartData>>): echarts.EChartsOption {
    const years   = d.points.map(p => String(p.year));
    const bpaVals = d.points.map(p => p.bpa);
    const dpaVals = d.points.map(p => p.dpa);
    const payVals = d.points.map(p => p.payout != null ? +p.payout.toFixed(2) : null);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const rows = (params as any[]).map((p: any) => {
            if (p.value == null) return '';
            const isLine = p.seriesIndex === 2;
            const val = isLine ? `${(p.value as number).toFixed(1)}%` : `$${(p.value as number).toFixed(2)}`;
            return `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:4px"></span>${p.seriesName}: <b>${val}</b>`;
          }).filter(Boolean);
          return `<b>${(params as any[])[0]?.name}</b><br/>${rows.join('<br/>')}`;
        },
      },
      legend: {
        top: 0,
        left: 'center',
        itemWidth: 14,
        itemHeight: 14,
        textStyle: { fontSize: 11.5 },
        data: ['Beneficio por Acción (BPA)', 'Dividendo por Acción (DPA)', 'Payout'],
      },
      grid: { top: 50, bottom: 40, left: '8%', right: '8%' },
      xAxis: {
        type: 'category',
        data: years,
        axisTick: { alignWithLabel: true },
        axisLabel: { fontWeight: 'bold', fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          name: '$/acción',
          nameTextStyle: { fontSize: 10, color: '#888' },
          axisLabel: { formatter: (v: number) => `$${v.toFixed(2)}` },
          splitLine: { lineStyle: { type: 'dashed', color: '#e0e0e0' } },
        },
        {
          type: 'value',
          name: 'Payout',
          nameTextStyle: { fontSize: 10, color: '#888' },
          min: 0,
          axisLabel: { formatter: (v: number) => `${v}%` },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Beneficio por Acción (BPA)',
          type: 'bar',
          yAxisIndex: 0,
          barMaxWidth: 40,
          itemStyle: { color: '#8fad6a' },
          data: bpaVals,
        },
        {
          name: 'Dividendo por Acción (DPA)',
          type: 'bar',
          yAxisIndex: 0,
          barMaxWidth: 40,
          itemStyle: { color: '#2d6a4a' },
          data: dpaVals,
        },
        {
          name: 'Payout',
          type: 'line',
          yAxisIndex: 1,
          smooth: false,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#e87a30', width: 2 },
          itemStyle: { color: '#e87a30' },
          data: payVals,
        },
      ],
    };
  }
}
