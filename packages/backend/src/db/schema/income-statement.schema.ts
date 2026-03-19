import {
  mysqlTable, int, smallint, char, varchar,
  bigint, decimal, mysqlEnum, timestamp, json, index,
} from 'drizzle-orm/mysql-core';
import { companies } from './companies.schema';

export const incomeStatement = mysqlTable(
  'income_statement',
  {
    id:                       int('id').autoincrement().primaryKey(),
    companyId:                int('company_id').notNull().references(() => companies.id),
    fiscalYear:               smallint('fiscal_year').notNull(),
    periodType:               mysqlEnum('period_type', ['annual', 'q1', 'q2', 'q3', 'q4']).notNull().default('annual'),
    currency:                 char('currency', { length: 3 }).notNull(),
    revenue:                  bigint('revenue',             { mode: 'number' }),
    revenueGrowthPct:         decimal('revenue_growth_pct', { precision: 8, scale: 4 }),
    costOfRevenue:            bigint('cost_of_revenue',  { mode: 'number' }),
    grossProfit:              bigint('gross_profit',      { mode: 'number' }),
    grossMarginPct:           decimal('gross_margin_pct', { precision: 8, scale: 4 }),
    researchAndDevelopment:   bigint('research_and_development',  { mode: 'number' }),
    sellingGeneralAdmin:      bigint('selling_general_admin',     { mode: 'number' }),
    depreciationAmortization: bigint('depreciation_amortization', { mode: 'number' }),
    otherOperatingExpenses:   bigint('other_operating_expenses',  { mode: 'number' }),
    operatingIncome:          bigint('operating_income',          { mode: 'number' }),
    operatingMarginPct:       decimal('operating_margin_pct', { precision: 8, scale: 4 }),
    interestExpense:          bigint('interest_expense',    { mode: 'number' }),
    interestIncome:           bigint('interest_income',     { mode: 'number' }),
    otherNonOperating:        bigint('other_non_operating', { mode: 'number' }),
    pretaxIncome:             bigint('pretax_income',           { mode: 'number' }),
    incomeTax:                bigint('income_tax',               { mode: 'number' }),
    effectiveTaxRatePct:      decimal('effective_tax_rate_pct',  { precision: 8, scale: 4 }),
    netIncome:                bigint('net_income',        { mode: 'number' }),
    minorityInterest:         bigint('minority_interest', { mode: 'number' }),
    netIncomeTotal:           bigint('net_income_total',  { mode: 'number' }),
    netMarginPct:             decimal('net_margin_pct', { precision: 8, scale: 4 }),
    sharesBasic:              bigint('shares_basic',   { mode: 'number' }),
    sharesDiluted:            bigint('shares_diluted', { mode: 'number' }),
    epsBasic:                 decimal('eps_basic',     { precision: 12, scale: 4 }),
    epsDiluted:               decimal('eps_diluted',   { precision: 12, scale: 4 }),
    ebitda:                   bigint('ebitda',              { mode: 'number' }),
    adjustedNetIncome:        bigint('adjusted_net_income', { mode: 'number' }),
    adjustedEps:              decimal('adjusted_eps', { precision: 12, scale: 4 }),
    extendedMetrics:          json('extended_metrics'),
    sourceFile:               varchar('source_file', { length: 255 }),
    importId:                 int('import_id'),
    createdAt:                timestamp('created_at').defaultNow(),
  },
  (table) => ({
    periodIdx:  index('idx_is_period').on(table.companyId, table.fiscalYear),
    companyIdx: index('idx_is_company').on(table.companyId),
  })
);

export type IncomeStatement    = typeof incomeStatement.$inferSelect;
export type NewIncomeStatement = typeof incomeStatement.$inferInsert;