import {
  mysqlTable, int, varchar, char,
  boolean, tinyint, timestamp, index,
  customType,
} from 'drizzle-orm/mysql-core';
import { sectors } from './sectors.schema';

const longblob = customType<{ data: Buffer }>({
  dataType() { return 'LONGBLOB'; },
});

export const companies = mysqlTable(
  'companies',
  {
    id:            int('id').autoincrement().primaryKey(),
    ticker:        varchar('ticker',   { length: 12  }).notNull(),
    isin:          varchar('isin',     { length: 12  }),
    name:          varchar('name',     { length: 150 }).notNull(),
    sectorId:      tinyint('sector_id').notNull().references(() => sectors.id),
    industry:      varchar('industry', { length: 100 }),
    countryIso:    char('country_iso', { length: 2   }).notNull(),
    currency:      char('currency',    { length: 3   }).notNull(),
    exchange:      varchar('exchange', { length: 20  }),
    logo:          longblob('logo'),
    logoMimeType:  varchar('logo_mime_type', { length: 20 }),
    fiscalYearEnd: tinyint('fiscal_year_end').notNull().default(12),
    isActive:      boolean('is_active').notNull().default(true),
    createdAt:     timestamp('created_at').defaultNow(),
    updatedAt:     timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    tickerIdx: index('idx_companies_ticker').on(table.ticker),
    isinIdx:   index('idx_companies_isin').on(table.isin),
  })
);


export type Company    = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;