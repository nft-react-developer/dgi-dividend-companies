// packages/backend/src/db/schema/balance-sheet.schema.ts

import {
  mysqlTable,
  int,
  smallint,
  char,
  varchar,
  bigint,
  decimal,
  mysqlEnum,
  timestamp,
  json,
  index,
} from 'drizzle-orm/mysql-core';
import { companies } from './companies.schema';

export const balanceSheet = mysqlTable(
  'balance_sheet',
  {
    id:         int('id').autoincrement().primaryKey(),
    companyId:  int('company_id').notNull().references(() => companies.id),
    fiscalYear: smallint('fiscal_year').notNull(),
    periodType: mysqlEnum('period_type', ['annual', 'q1', 'q2', 'q3', 'q4']).notNull().default('annual'),
    currency:   char('currency', { length: 3 }).notNull(),

    // ── Assets ──────────────────────────────────────────────────────────────
    cashAndEquivalents:       bigint('cash_and_equivalents',        { mode: 'number' }),
    shortTermInvestments:     bigint('short_term_investments',      { mode: 'number' }),
    accountsReceivable:       bigint('accounts_receivable',         { mode: 'number' }),
    inventory:                bigint('inventory',                   { mode: 'number' }),
    otherCurrentAssets:       bigint('other_current_assets',        { mode: 'number' }),
    totalCurrentAssets:       bigint('total_current_assets',        { mode: 'number' }),

    propertyPlantEquipmentNet: bigint('property_plant_equipment_net', { mode: 'number' }),
    goodwill:                 bigint('goodwill',                    { mode: 'number' }),
    intangibleAssets:         bigint('intangible_assets',           { mode: 'number' }),
    longTermInvestments:      bigint('long_term_investments',       { mode: 'number' }),
    otherNonCurrentAssets:    bigint('other_non_current_assets',    { mode: 'number' }),
    totalNonCurrentAssets:    bigint('total_non_current_assets',    { mode: 'number' }),

    totalAssets:              bigint('total_assets',                { mode: 'number' }),

    // ── Liabilities ─────────────────────────────────────────────────────────
    accountsPayable:          bigint('accounts_payable',            { mode: 'number' }),
    shortTermDebt:            bigint('short_term_debt',             { mode: 'number' }),
    currentPortionLongTermDebt: bigint('current_portion_long_term_debt', { mode: 'number' }),
    otherCurrentLiabilities:  bigint('other_current_liabilities',  { mode: 'number' }),
    totalCurrentLiabilities:  bigint('total_current_liabilities',  { mode: 'number' }),

    longTermDebt:             bigint('long_term_debt',              { mode: 'number' }),
    deferredTaxLiabilities:   bigint('deferred_tax_liabilities',   { mode: 'number' }),
    otherNonCurrentLiabilities: bigint('other_non_current_liabilities', { mode: 'number' }),
    totalNonCurrentLiabilities: bigint('total_non_current_liabilities', { mode: 'number' }),

    totalLiabilities:         bigint('total_liabilities',           { mode: 'number' }),

    // ── Equity ──────────────────────────────────────────────────────────────
    commonStock:              bigint('common_stock',                { mode: 'number' }),
    retainedEarnings:         bigint('retained_earnings',           { mode: 'number' }),
    additionalPaidInCapital:  bigint('additional_paid_in_capital',  { mode: 'number' }),
    treasuryStock:            bigint('treasury_stock',              { mode: 'number' }),
    accumulatedOtherComprehensiveIncome: bigint('accumulated_other_comprehensive_income', { mode: 'number' }),
    totalEquity:              bigint('total_equity',                { mode: 'number' }),
    totalLiabilitiesAndEquity: bigint('total_liabilities_and_equity', { mode: 'number' }),

    // ── Ratios derivados (DGI) ───────────────────────────────────────────────
    // Calculados post-mapping, guardados para consulta rápida
    debtToEquity:             decimal('debt_to_equity',   { precision: 10, scale: 4 }),
    currentRatio:             decimal('current_ratio',    { precision: 10, scale: 4 }),
    bookValuePerShare:        decimal('book_value_per_share', { precision: 12, scale: 4 }),

    // ── Meta ────────────────────────────────────────────────────────────────
    extendedMetrics: json('extended_metrics'),
    sourceFile:      varchar('source_file', { length: 255 }),
    importId:        int('import_id'),
    createdAt:       timestamp('created_at').defaultNow(),
  },
  (table) => ({
    periodIdx:  index('idx_bs_period').on(table.companyId, table.fiscalYear),
    companyIdx: index('idx_bs_company').on(table.companyId),
  }),
);

export type BalanceSheet    = typeof balanceSheet.$inferSelect;
export type NewBalanceSheet = typeof balanceSheet.$inferInsert;