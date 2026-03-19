import {
  mysqlTable, int, varchar, boolean,
  tinyint, timestamp, mysqlEnum, index,
} from 'drizzle-orm/mysql-core';
import { companies } from './companies.schema';

export const fieldMappers = mysqlTable(
  'field_mappers',
  {
    id:             int('id').autoincrement().primaryKey(),
    companyId:      int('company_id').references(() => companies.id),
    statementType:  mysqlEnum('statement_type', [
                      'income_statement', 'balance_sheet', 'cash_flow', 'dividends'
                    ]).notNull(),
    rawLabel:       varchar('raw_label',       { length: 255 }).notNull(),
    canonicalField: varchar('canonical_field', { length: 100 }).notNull(),
    targetTable:    varchar('target_table',    { length: 50  }).notNull(),
    targetColumn:   varchar('target_column',   { length: 100 }).notNull(),
    transform:      mysqlEnum('transform', [
                      'none', 'negate', 'abs', 'thousands', 'millions', 'pct_to_decimal'
                    ]).notNull().default('none'),
    priority:       tinyint('priority').notNull().default(10),
    isActive:       boolean('is_active').notNull().default(true),
    notes:          varchar('notes', { length: 255 }),
    createdAt:      timestamp('created_at').defaultNow(),
  },
  (table) => ({
    labelIdx:   index('idx_mapper_label').on(table.rawLabel),
    companyIdx: index('idx_mapper_company').on(table.companyId),
  })
);

export type FieldMapper    = typeof fieldMappers.$inferSelect;
export type NewFieldMapper = typeof fieldMappers.$inferInsert;