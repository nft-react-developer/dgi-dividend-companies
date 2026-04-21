import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { CompaniesService } from '../companies/companies.service';
import { FinancialDataService } from './financial-data.service';
import type { Company } from '../companies/company.model';
import type {
  FinancialData,
  BalanceSheetRecord,
  IncomeStatementRecord,
  CashFlowRecord,
} from './financial-data.model';

interface RowDef {
  label:    string;
  field:    string;
  type?:    'currency' | 'pct' | 'shares' | 'ratio';
  bold?:    boolean;
  section?: string;
}

@Component({
  selector:   'app-financial-data',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule, TabsModule, SkeletonModule],
  template: `
    <div class="fd-wrap">

      <!-- Company search -->
      <div class="search-row">
        <p-autoComplete
          [(ngModel)]="selectedCompany"
          [suggestions]="suggestions()"
          (completeMethod)="search($event)"
          (onSelect)="onSelect($event)"
          optionLabel="name"
          placeholder="Search company by name or ticker…"
          [dropdown]="true"
          styleClass="company-ac"
          appendTo="body"
        >
          <ng-template #item let-c>
            <div class="ac-item">
              <span class="ac-ticker">{{ c.ticker }}</span>
              <span class="ac-name">{{ c.name }}</span>
            </div>
          </ng-template>
        </p-autoComplete>
      </div>

      <!-- Loading skeleton -->
      @if (loading()) {
        <div class="skeleton-wrap">
          @for (i of [1,2,3,4,5,6]; track i) {
            <p-skeleton height="2rem" styleClass="mb-2" />
          }
        </div>
      }

      <!-- No company selected -->
      @if (!loading() && !data() && !selectedCompany) {
        <div class="empty-state">
          <i class="pi pi-search"></i>
          <p>Select a company to view its financial statements</p>
        </div>
      }

      <!-- Data tables -->
      @if (!loading() && data(); as d) {
        <p-tabs value="balance">
          <p-tablist>
            <p-tab value="balance">Balance Sheet</p-tab>
            <p-tab value="income">Income Statement</p-tab>
            <p-tab value="cashflow">Cash Flows</p-tab>
          </p-tablist>

          <p-tabpanels>

            <!-- Balance Sheet -->
            <p-tabpanel value="balance">
              <div class="table-wrap">
                @if (d.balance.length === 0) {
                  <p class="no-data">No balance sheet data available</p>
                } @else {
                  <table class="fin-table">
                    <thead>
                      <tr>
                        <th class="label-col">Metric</th>
                        @for (y of years(); track y) { <th>{{ y }}</th> }
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of balanceRows; track row.field) {
                        @if (row.section) {
                          <tr class="section-header">
                            <td [attr.colspan]="years().length + 1">{{ row.section }}</td>
                          </tr>
                        }
                        <tr [class.total-row]="row.bold">
                          <td class="label-col">{{ row.label }}</td>
                          @for (y of years(); track y) {
                            <td [class.negative]="isNeg(bVal(d.balance, y, row.field))">
                              {{ fmt(bVal(d.balance, y, row.field), row.type) }}
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            </p-tabpanel>

            <!-- Income Statement -->
            <p-tabpanel value="income">
              <div class="table-wrap">
                @if (d.income.length === 0) {
                  <p class="no-data">No income statement data available</p>
                } @else {
                  <table class="fin-table">
                    <thead>
                      <tr>
                        <th class="label-col">Metric</th>
                        @for (y of years(); track y) { <th>{{ y }}</th> }
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of incomeRows; track row.field) {
                        @if (row.section) {
                          <tr class="section-header">
                            <td [attr.colspan]="years().length + 1">{{ row.section }}</td>
                          </tr>
                        }
                        <tr [class.total-row]="row.bold">
                          <td class="label-col">{{ row.label }}</td>
                          @for (y of years(); track y) {
                            <td [class.negative]="isNeg(iVal(d.income, y, row.field))">
                              {{ fmt(iVal(d.income, y, row.field), row.type) }}
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            </p-tabpanel>

            <!-- Cash Flows -->
            <p-tabpanel value="cashflow">
              <div class="table-wrap">
                @if (d.cashflow.length === 0) {
                  <p class="no-data">No cash flow data available</p>
                } @else {
                  <table class="fin-table">
                    <thead>
                      <tr>
                        <th class="label-col">Metric</th>
                        @for (y of years(); track y) { <th>{{ y }}</th> }
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of cashflowRows; track row.field) {
                        @if (row.section) {
                          <tr class="section-header">
                            <td [attr.colspan]="years().length + 1">{{ row.section }}</td>
                          </tr>
                        }
                        <tr [class.total-row]="row.bold">
                          <td class="label-col">{{ row.label }}</td>
                          @for (y of years(); track y) {
                            <td [class.negative]="isNeg(cVal(d.cashflow, y, row.field))">
                              {{ fmt(cVal(d.cashflow, y, row.field), row.type) }}
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            </p-tabpanel>

          </p-tabpanels>
        </p-tabs>
      }
    </div>
  `,
  styles: [`
    .fd-wrap {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .search-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    ::ng-deep .company-ac {
      width: 360px;
    }

    .ac-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .ac-ticker {
      font-weight: 600;
      font-size: 0.8rem;
      color: var(--p-primary-color);
      min-width: 48px;
    }
    .ac-name {
      font-size: 0.85rem;
      color: var(--p-text-color);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 3rem 0;
      color: var(--p-text-muted-color);
      i { font-size: 2rem; }
      p { font-size: 0.9rem; margin: 0; }
    }

    .skeleton-wrap {
      padding: 1rem 0;
    }

    .table-wrap {
      overflow-x: auto;
      margin-top: 0.5rem;
    }

    .no-data {
      color: var(--p-text-muted-color);
      font-size: 0.85rem;
      padding: 1.5rem 0;
      text-align: center;
    }

    .fin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;

      thead tr {
        border-bottom: 2px solid var(--p-surface-border);
      }

      th {
        padding: 0.5rem 0.75rem;
        text-align: right;
        font-weight: 600;
        color: var(--p-text-muted-color);
        white-space: nowrap;
        &:first-child { text-align: left; }
      }

      td {
        padding: 0.4rem 0.75rem;
        text-align: right;
        border-bottom: 1px solid var(--p-surface-border);
        color: var(--p-text-color);
        white-space: nowrap;
        &:first-child { text-align: left; }
      }

      tr:hover td { background: var(--p-surface-hover); }

      .section-header td {
        background: var(--p-surface-section, var(--p-surface-ground));
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--p-text-muted-color);
        text-align: left;
        padding: 0.5rem 0.75rem 0.25rem;
        border-bottom: none;
      }
      .section-header:hover td { background: var(--p-surface-section, var(--p-surface-ground)); }

      .total-row td {
        font-weight: 600;
        background: var(--p-surface-ground);
        border-top: 1px solid var(--p-surface-border);
      }
      .total-row:hover td { background: var(--p-surface-hover); }

      .negative { color: var(--p-red-500, #ef4444); }
    }
  `],
})
export class FinancialDataComponent implements OnInit {
  private companiesSvc = inject(CompaniesService);
  private financialSvc = inject(FinancialDataService);

  selectedCompany: Company | null = null;
  suggestions = signal<Company[]>([]);
  data    = signal<FinancialData | null>(null);
  loading = signal(false);

  years = computed(() => {
    const d = this.data();
    if (!d) return [];
    const all = new Set([
      ...d.balance.map(r => r.fiscalYear),
      ...d.income.map(r => r.fiscalYear),
      ...d.cashflow.map(r => r.fiscalYear),
    ]);
    return [...all].sort((a, b) => b - a);
  });

  // ── Row definitions ──────────────────────────────────────────────────────────

  readonly balanceRows: RowDef[] = [
    { section: 'Assets', label: 'Cash & Equivalents',       field: 'cashAndEquivalents' },
    { label: 'Short-Term Investments',    field: 'shortTermInvestments' },
    { label: 'Accounts Receivable',       field: 'accountsReceivable' },
    { label: 'Inventory',                 field: 'inventory' },
    { label: 'Other Current Assets',      field: 'otherCurrentAssets' },
    { label: 'Total Current Assets',      field: 'totalCurrentAssets',      bold: true },
    { label: 'PP&E, Net',                 field: 'propertyPlantEquipmentNet' },
    { label: 'Goodwill',                  field: 'goodwill' },
    { label: 'Intangible Assets',         field: 'intangibleAssets' },
    { label: 'Long-Term Investments',     field: 'longTermInvestments' },
    { label: 'Other Non-Current Assets',  field: 'otherNonCurrentAssets' },
    { label: 'Total Non-Current Assets',  field: 'totalNonCurrentAssets',   bold: true },
    { label: 'Total Assets',              field: 'totalAssets',              bold: true },
    { section: 'Liabilities', label: 'Accounts Payable',           field: 'accountsPayable' },
    { label: 'Short-Term Debt',                    field: 'shortTermDebt' },
    { label: 'Current Portion L-T Debt',           field: 'currentPortionLongTermDebt' },
    { label: 'Other Current Liabilities',          field: 'otherCurrentLiabilities' },
    { label: 'Total Current Liabilities',          field: 'totalCurrentLiabilities',  bold: true },
    { label: 'Long-Term Debt',                     field: 'longTermDebt' },
    { label: 'Deferred Tax Liabilities',           field: 'deferredTaxLiabilities' },
    { label: 'Other Non-Current Liabilities',      field: 'otherNonCurrentLiabilities' },
    { label: 'Total Non-Current Liabilities',      field: 'totalNonCurrentLiabilities', bold: true },
    { label: 'Total Liabilities',                  field: 'totalLiabilities',           bold: true },
    { section: 'Equity', label: 'Common Stock',              field: 'commonStock' },
    { label: 'Retained Earnings',         field: 'retainedEarnings' },
    { label: 'Additional Paid-In Capital',field: 'additionalPaidInCapital' },
    { label: 'Treasury Stock',            field: 'treasuryStock' },
    { label: 'AOCI',                      field: 'accumulatedOtherComprehensiveIncome' },
    { label: 'Total Equity',              field: 'totalEquity',              bold: true },
    { label: 'Total Liabilities & Equity',field: 'totalLiabilitiesAndEquity', bold: true },
    { section: 'Ratios', label: 'Debt / Equity',             field: 'debtToEquity',     type: 'ratio' },
    { label: 'Current Ratio',             field: 'currentRatio',             type: 'ratio' },
    { label: 'Book Value / Share',        field: 'bookValuePerShare',        type: 'ratio' },
  ];

  readonly incomeRows: RowDef[] = [
    { section: 'Revenue', label: 'Revenue',                  field: 'revenue' },
    { label: 'Cost of Revenue',           field: 'costOfRevenue' },
    { label: 'Gross Profit',              field: 'grossProfit',              bold: true },
    { label: 'Gross Margin %',            field: 'grossMarginPct',           type: 'pct' },
    { section: 'Operating Expenses', label: 'R&D',           field: 'researchAndDevelopment' },
    { label: 'SG&A',                      field: 'sellingGeneralAdmin' },
    { label: 'D&A',                       field: 'depreciationAmortization' },
    { label: 'Other Operating Expenses',  field: 'otherOperatingExpenses' },
    { label: 'Operating Income',          field: 'operatingIncome',          bold: true },
    { label: 'Operating Margin %',        field: 'operatingMarginPct',       type: 'pct' },
    { section: 'Below the Line', label: 'Interest Expense',  field: 'interestExpense' },
    { label: 'Interest Income',           field: 'interestIncome' },
    { label: 'Other Non-Operating',       field: 'otherNonOperating' },
    { label: 'Pretax Income',             field: 'pretaxIncome',             bold: true },
    { label: 'Income Tax',                field: 'incomeTax' },
    { label: 'Effective Tax Rate %',      field: 'effectiveTaxRatePct',      type: 'pct' },
    { label: 'Net Income',                field: 'netIncome',                bold: true },
    { label: 'Net Margin %',              field: 'netMarginPct',             type: 'pct' },
    { section: 'Per Share', label: 'Shares Basic (M)',        field: 'sharesBasic',  type: 'shares' },
    { label: 'Shares Diluted (M)',        field: 'sharesDiluted',            type: 'shares' },
    { label: 'EPS Basic',                 field: 'epsBasic',                 type: 'ratio' },
    { label: 'EPS Diluted',              field: 'epsDiluted',               type: 'ratio' },
    { section: 'Other', label: 'EBITDA', field: 'ebitda',                   bold: true },
    { label: 'Adjusted Net Income',       field: 'adjustedNetIncome' },
    { label: 'Adjusted EPS',             field: 'adjustedEps',              type: 'ratio' },
  ];

  readonly cashflowRows: RowDef[] = [
    { section: 'Operating Activities', label: 'Net Income',          field: 'netIncome' },
    { label: 'D&A',                            field: 'depreciationAmortization' },
    { label: 'Stock-Based Compensation',       field: 'stockBasedCompensation' },
    { label: 'Changes in Working Capital',     field: 'changesInWorkingCapital' },
    { label: 'Other Operating Activities',     field: 'otherOperatingActivities' },
    { label: 'Net Cash from Operations',       field: 'netCashFromOperations',    bold: true },
    { section: 'Investing Activities', label: 'Capital Expenditures', field: 'capitalExpenditures' },
    { label: 'Acquisitions',                   field: 'acquisitions' },
    { label: 'Purchases of Investments',       field: 'purchasesOfInvestments' },
    { label: 'Sales of Investments',           field: 'salesOfInvestments' },
    { label: 'Other Investing Activities',     field: 'otherInvestingActivities' },
    { label: 'Net Cash from Investing',        field: 'netCashFromInvesting',     bold: true },
    { section: 'Financing Activities', label: 'Debt Repayment',      field: 'debtRepayment' },
    { label: 'Issuance of Debt',               field: 'issuanceOfDebt' },
    { label: 'Issuance of Stock',              field: 'issuanceOfStock' },
    { label: 'Repurchase of Stock',            field: 'repurchaseOfStock' },
    { label: 'Dividends Paid',                 field: 'dividendsPaid' },
    { label: 'Other Financing Activities',     field: 'otherFinancingActivities' },
    { label: 'Net Cash from Financing',        field: 'netCashFromFinancing',     bold: true },
    { section: 'Summary', label: 'Net Change in Cash',               field: 'netChangeInCash' },
    { label: 'Free Cash Flow',                 field: 'freeCashFlow',             bold: true },
  ];

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnInit() {
    if (!this.companiesSvc.items().length) {
      this.companiesSvc.load();
    }
  }

  // ── Autocomplete ─────────────────────────────────────────────────────────────

  search(event: { query: string }) {
    const q = event.query.toLowerCase();
    this.suggestions.set(
      this.companiesSvc.items()
        .filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.ticker.toLowerCase().includes(q)
        )
        .slice(0, 10)
    );
  }

  onSelect(event: { value: Company }) {
    this.loadData(event.value.id);
  }

  // ── Data loading ─────────────────────────────────────────────────────────────

  async loadData(companyId: number) {
    this.loading.set(true);
    this.data.set(null);
    try {
      const result = await this.financialSvc.getFinancialData(companyId);
      this.data.set(result);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Value accessors ──────────────────────────────────────────────────────────

  bVal(rows: BalanceSheetRecord[], year: number, field: string): number | string | null {
    const rec = rows.find(r => r.fiscalYear === year);
    return rec ? (rec as unknown as Record<string, number | string | null>)[field] : null;
  }

  iVal(rows: IncomeStatementRecord[], year: number, field: string): number | string | null {
    const rec = rows.find(r => r.fiscalYear === year);
    return rec ? (rec as unknown as Record<string, number | string | null>)[field] : null;
  }

  cVal(rows: CashFlowRecord[], year: number, field: string): number | string | null {
    const rec = rows.find(r => r.fiscalYear === year);
    return rec ? (rec as unknown as Record<string, number | string | null>)[field] : null;
  }

  // ── Formatting ───────────────────────────────────────────────────────────────

  isNeg(val: number | string | null): boolean {
    if (val == null) return false;
    return Number(val) < 0;
  }

  fmt(val: number | string | null, type?: 'currency' | 'pct' | 'shares' | 'ratio'): string {
    if (val == null) return '—';
    const n = Number(val);
    if (isNaN(n)) return '—';

    if (type === 'pct')   return `${n.toFixed(2)}%`;
    if (type === 'ratio') return n.toFixed(2);
    if (type === 'shares') {
      const abs = Math.abs(n);
      if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
      if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
      return n.toLocaleString();
    }

    // currency (default)
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
    return `${sign}$${abs.toFixed(0)}`;
  }
}
