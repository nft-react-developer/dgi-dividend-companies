import {
  mysqlTable, int, smallint, char, varchar,
  bigint, timestamp, json, mysqlEnum, index,
} from 'drizzle-orm/mysql-core';
import { companies } from './companies.schema';

export const cashFlowStatement = mysqlTable(
  'cash_flow_statement',
  {
    id:         int('id').autoincrement().primaryKey(),
    companyId:  int('company_id').notNull().references(() => companies.id),
    fiscalYear: smallint('fiscal_year').notNull(),
    periodType: mysqlEnum('period_type', ['annual', 'q1', 'q2', 'q3', 'q4']).notNull().default('annual'),
    currency:   char('currency', { length: 3 }).notNull(),

    // ── Operating ────────────────────────────────────────────────────────────
    netIncome:                bigint('net_income',                 { mode: 'number' }),
    depreciationAmortization: bigint('depreciation_amortization',  { mode: 'number' }),
    stockBasedCompensation:   bigint('stock_based_compensation',   { mode: 'number' }),
    changesInWorkingCapital:  bigint('changes_in_working_capital', { mode: 'number' }),
    otherOperatingActivities: bigint('other_operating_activities', { mode: 'number' }),
    netCashFromOperations:    bigint('net_cash_from_operations',   { mode: 'number' }),

    // ── Investing ────────────────────────────────────────────────────────────
    capitalExpenditures:      bigint('capital_expenditures',       { mode: 'number' }),
    acquisitions:             bigint('acquisitions',               { mode: 'number' }),
    purchasesOfInvestments:   bigint('purchases_of_investments',   { mode: 'number' }),
    salesOfInvestments:       bigint('sales_of_investments',       { mode: 'number' }),
    otherInvestingActivities: bigint('other_investing_activities', { mode: 'number' }),
    netCashFromInvesting:     bigint('net_cash_from_investing',    { mode: 'number' }),

    // ── Financing ────────────────────────────────────────────────────────────
    debtRepayment:            bigint('debt_repayment',             { mode: 'number' }),
    issuanceOfDebt:           bigint('issuance_of_debt',           { mode: 'number' }),
    issuanceOfStock:          bigint('issuance_of_stock',          { mode: 'number' }),
    repurchaseOfStock:        bigint('repurchase_of_stock',        { mode: 'number' }),
    dividendsPaid:            bigint('dividends_paid',             { mode: 'number' }),
    otherFinancingActivities: bigint('other_financing_activities', { mode: 'number' }),
    netCashFromFinancing:     bigint('net_cash_from_financing',    { mode: 'number' }),

    // ── Summary ──────────────────────────────────────────────────────────────
    netChangeInCash:          bigint('net_change_in_cash',         { mode: 'number' }),
    freeCashFlow:             bigint('free_cash_flow',             { mode: 'number' }),

    extendedMetrics: json('extended_metrics'),
    sourceFile:      varchar('source_file', { length: 255 }),
    importId:        int('import_id'),
    createdAt:       timestamp('created_at').defaultNow(),
  },
  (table) => ({
    periodIdx:  index('idx_cf_period').on(table.companyId, table.fiscalYear),
    companyIdx: index('idx_cf_company').on(table.companyId),
  }),
);

export type CashFlowStatement    = typeof cashFlowStatement.$inferSelect;
export type NewCashFlowStatement = typeof cashFlowStatement.$inferInsert;
