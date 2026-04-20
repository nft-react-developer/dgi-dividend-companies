import {
  mysqlTable, int, smallint, varchar, text,
  mysqlEnum, timestamp, json, index,
} from 'drizzle-orm/mysql-core';
import { companies } from './companies.schema';

export const importLog = mysqlTable(
  'import_log',
  {
    id:               int('id').autoincrement().primaryKey(),
    companyId:        int('company_id').notNull().references(() => companies.id),
    fiscalYear:       smallint('fiscal_year').notNull(),
    periodType:       mysqlEnum('period_type', ['annual', 'q1', 'q2', 'q3', 'q4'])
                        .notNull().default('annual'),
    sourceFile:       varchar('source_file', { length: 255 }).notNull(),
    sourceType:       mysqlEnum('source_type', [
                        'pdf_annual', 'pdf_10k', 'pdf_6k', 'manual', 'api_edgar',
                      ]).notNull(),
    parseEngine:      mysqlEnum('parse_engine', ['regex', 'llm', 'hybrid'])
                        .notNull().default('llm'),
    status:           mysqlEnum('status', [
                        'pending', 'parsing', 'mapped', 'stored', 'error',
                      ]).notNull().default('pending'),
    fieldsExtracted:  int('fields_extracted').notNull().default(0),
    fieldsMapped:     int('fields_mapped').notNull().default(0),
    fieldsFailed:     int('fields_failed').notNull().default(0),
    unmappedLabels:   json('unmapped_labels'),
    errorMessage:     text('error_message'),
    rawExtractJson:   text('raw_extract_json'),
    importedBy:       varchar('imported_by', { length: 80 }),
    startedAt:        timestamp('started_at').defaultNow(),
    finishedAt:       timestamp('finished_at'),
  },
  (table) => ({
    companyIdx: index('idx_import_company').on(table.companyId),
    statusIdx:  index('idx_import_status').on(table.status),
  })
);

export type ImportLog    = typeof importLog.$inferSelect;
export type NewImportLog = typeof importLog.$inferInsert;