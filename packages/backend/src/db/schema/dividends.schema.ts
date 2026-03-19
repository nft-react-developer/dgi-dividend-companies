import {
  mysqlTable, int, smallint, char, varchar,
  decimal, date, boolean, mysqlEnum, timestamp, index,
} from 'drizzle-orm/mysql-core';
import { companies } from './companies.schema';

export const dividends = mysqlTable(
  'dividends',
  {
    id:             int('id').autoincrement().primaryKey(),
    companyId:      int('company_id').notNull().references(() => companies.id),
    fiscalYear:     smallint('fiscal_year').notNull(),
    exDate:         date('ex_date').notNull(),
    recordDate:     date('record_date'),
    paymentDate:    date('payment_date'),
    declaredDate:   date('declared_date'),
    amountPerShare: decimal('amount_per_share', { precision: 12, scale: 6 }).notNull(),
    currency:       char('currency', { length: 3 }).notNull(),
    frequency:      mysqlEnum('frequency', [
                      'monthly', 'quarterly', 'semi_annual', 'annual', 'special'
                    ]).notNull(),
    dividendType:   mysqlEnum('dividend_type', [
                      'ordinary', 'special', 'scrip', 'return_of_capital'
                    ]).notNull().default('ordinary'),
    isEstimated:    boolean('is_estimated').notNull().default(false),
    notes:          varchar('notes', { length: 255 }),
    createdAt:      timestamp('created_at').defaultNow(),
  },
  (table) => ({
    exDateIdx:      index('idx_div_exdate').on(table.exDate),
    paymentIdx:     index('idx_div_payment').on(table.paymentDate),
    companyYearIdx: index('idx_div_company_yr').on(table.companyId, table.fiscalYear),
  })
);

export type Dividend    = typeof dividends.$inferSelect;
export type NewDividend = typeof dividends.$inferInsert;