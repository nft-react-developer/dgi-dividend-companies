import { relations } from 'drizzle-orm';
import { sectors } from './sectors.schema';
import { companies } from './companies.schema';
import { incomeStatement } from './income-statement.schema';
import { dividends } from './dividends.schema';
import { fieldMappers } from './field-mappers.schema';

export const sectorsRelations = relations(sectors, ({ many }) => ({
  companies: many(companies),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  sector:           one(sectors, { fields: [companies.sectorId], references: [sectors.id] }),
  incomeStatements: many(incomeStatement),
  dividends:        many(dividends),
  fieldMappers:     many(fieldMappers),
}));

export const incomeStatementRelations = relations(incomeStatement, ({ one }) => ({
  company: one(companies, { fields: [incomeStatement.companyId], references: [companies.id] }),
}));

export const dividendsRelations = relations(dividends, ({ one }) => ({
  company: one(companies, { fields: [dividends.companyId], references: [companies.id] }),
}));

export const fieldMappersRelations = relations(fieldMappers, ({ one }) => ({
  company: one(companies, { fields: [fieldMappers.companyId], references: [companies.id] }),
}));