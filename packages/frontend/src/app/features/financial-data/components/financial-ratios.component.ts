import { Component, input, computed } from '@angular/core';
import type {
  FinancialData,
  BalanceSheetRecord,
  IncomeStatementRecord,
  CashFlowRecord,
} from '../financial-data.model';
import { BalanceSheetChartComponent } from './balance-sheet-chart.component';
import { DividendChartComponent } from './dividend-chart.component';

interface RatioValue {
  year:  number;
  value: number | string | null;
}

interface RatioRow {
  label:    string;
  section?: string;
  type?:    'pct' | 'ratio' | 'currency';
  bold?:    boolean;
  values:   RatioValue[];
}

@Component({
  selector:   'app-financial-ratios',
  standalone: true,
 templateUrl: './financial-ratios.component.html',
 styleUrl:  './financial-ratios.component.scss',
 imports: [BalanceSheetChartComponent, DividendChartComponent],
})
export class FinancialRatiosComponent {
  data  = input.required<FinancialData>();
  years = input.required<number[]>();

  rows = computed<RatioRow[]>(() => {
    const d  = this.data();
    const ys = this.years();
    if (!ys.length) return [];

    const b   = (y: number, f: keyof BalanceSheetRecord)     => this.pick(d.balance,  y, f);
    const inc = (y: number, f: keyof IncomeStatementRecord)  => this.pick(d.income,   y, f);
    const cf  = (y: number, f: keyof CashFlowRecord)         => this.pick(d.cashflow, y, f);

    const derive = (fn: (y: number) => number | string | null): RatioValue[] =>
      ys.map(y => ({ year: y, value: fn(y) }));

    return [
      // ── Profitability ──────────────────────────────────────────────────────────
      { section: 'Profitability',
        label: 'Gross Margin %',          type: 'pct',
        values: derive(y => inc(y, 'grossMarginPct')) },
      { label: 'Operating Margin %',      type: 'pct',
        values: derive(y => inc(y, 'operatingMarginPct')) },
      { label: 'Net Margin %',            type: 'pct',
        values: derive(y => inc(y, 'netMarginPct')) },
      { label: 'Return on Equity (ROE) %', type: 'pct', bold: true,
        values: derive(y => {
          const ni = toNum(inc(y, 'netIncome'));
          const eq = toNum(b(y,   'totalEquity'));
          return ni != null && eq ? (ni / eq) * 100 : null;
        }) },
      { label: 'Return on Assets (ROA) %', type: 'pct',
        values: derive(y => {
          const ni = toNum(inc(y, 'netIncome'));
          const ta = toNum(b(y,   'totalAssets'));
          return ni != null && ta ? (ni / ta) * 100 : null;
        }) },
      { label: 'EBITDA Margin %',         type: 'pct',
        values: derive(y => {
          const eb  = toNum(inc(y, 'ebitda'));
          const rev = toNum(inc(y, 'revenue'));
          return eb != null && rev ? (eb / rev) * 100 : null;
        }) },

      // ── Per Share ──────────────────────────────────────────────────────────────
      { section: 'Per Share',
        label: 'EPS Basic',               type: 'ratio',
        values: derive(y => inc(y, 'epsBasic')) },
      { label: 'EPS Diluted',             type: 'ratio',
        values: derive(y => inc(y, 'epsDiluted')) },
      { label: 'Book Value / Share',      type: 'ratio',
        values: derive(y => b(y, 'bookValuePerShare')) },
      { label: 'FCF / Share',             type: 'ratio',
        values: derive(y => {
          const fcf    = toNum(cf(y,  'freeCashFlow'));
          const shares = toNum(inc(y, 'sharesDiluted'));
          return fcf != null && shares ? fcf / shares : null;
        }) },

      // ── Liquidity ──────────────────────────────────────────────────────────────
      { section: 'Liquidity',
        label: 'Current Ratio',           type: 'ratio',
        values: derive(y => b(y, 'currentRatio')) },
      { label: 'Quick Ratio',             type: 'ratio',
        values: derive(y => {
          const ca  = toNum(b(y, 'totalCurrentAssets'));
          const inv = toNum(b(y, 'inventory')) ?? 0;
          const cl  = toNum(b(y, 'totalCurrentLiabilities'));
          return ca != null && cl ? (ca - inv) / cl : null;
        }) },
      { label: 'Cash Ratio',              type: 'ratio',
        values: derive(y => {
          const cash = toNum(b(y, 'cashAndEquivalents'));
          const cl   = toNum(b(y, 'totalCurrentLiabilities'));
          return cash != null && cl ? cash / cl : null;
        }) },

      // ── Leverage ───────────────────────────────────────────────────────────────
      { section: 'Leverage',
        label: 'Debt / Equity',           type: 'ratio',
        values: derive(y => b(y, 'debtToEquity')) },
      { label: 'Interest Coverage',       type: 'ratio',
        values: derive(y => {
          const oi = toNum(inc(y, 'operatingIncome'));
          const ie = toNum(inc(y, 'interestExpense'));
          return oi != null && ie ? oi / Math.abs(ie) : null;
        }) },
      { label: 'Debt / EBITDA',           type: 'ratio',
        values: derive(y => {
          const ltd    = toNum(b(y,   'longTermDebt'))  ?? 0;
          const std    = toNum(b(y,   'shortTermDebt')) ?? 0;
          const ebitda = toNum(inc(y, 'ebitda'));
          return ebitda ? (ltd + std) / ebitda : null;
        }) },

      // ── Dividend ───────────────────────────────────────────────────────────────
      { section: 'Dividend',
        label: 'Dividends Paid',          type: 'currency',
        values: derive(y => cf(y, 'dividendsPaid')) },
      { label: 'FCF Payout Ratio %',      type: 'pct',
        values: derive(y => {
          const div = toNum(cf(y, 'dividendsPaid'));
          const fcf = toNum(cf(y, 'freeCashFlow'));
          return div != null && fcf ? (Math.abs(div) / fcf) * 100 : null;
        }) },
      { label: 'Earnings Payout Ratio %', type: 'pct',
        values: derive(y => {
          const div = toNum(cf(y,  'dividendsPaid'));
          const ni  = toNum(inc(y, 'netIncome'));
          return div != null && ni ? (Math.abs(div) / ni) * 100 : null;
        }) },
      { label: 'Free Cash Flow',          type: 'currency', bold: true,
        values: derive(y => cf(y, 'freeCashFlow')) },
    ];
  });

  private pick<T extends BalanceSheetRecord | IncomeStatementRecord | CashFlowRecord>(
    rows: T[],
    year: number,
    field: keyof T,
  ): number | string | null {
    const rec = rows.find(r => r.fiscalYear === year);
    if (!rec) return null;
    const val = rec[field];
    return (val as number | string | null) ?? null;
  }

  isNeg(val: number | string | null): boolean {
    if (val == null) return false;
    return Number(val) < 0;
  }

  fmt(val: number | string | null, type?: 'pct' | 'ratio' | 'currency'): string {
    if (val == null) return '—';
    const n = Number(val);
    if (isNaN(n)) return '—';

    if (type === 'pct')   return `${n.toFixed(2)}%`;
    if (type === 'ratio') return n.toFixed(2);

    // currency
    const abs  = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
    return `${sign}$${abs.toFixed(0)}`;
  }
}

function toNum(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
