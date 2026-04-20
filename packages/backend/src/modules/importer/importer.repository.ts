// src/modules/importer/importer.repository.ts

import { eq, and } from 'drizzle-orm';
import { getDb, schema } from '../../db/connection';
import { AppError } from '../../shared/errors/error-handler';
import type { NewIncomeStatement } from '../../db/schema/income-statement.schema';
import type { MappedRecord } from './types/mapping.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveCompanyId(ticker: string): Promise<number> {
  const db = await getDb();
  const rows = await db
    .select({ id: schema.companies.id })
    .from(schema.companies)
    .where(eq(schema.companies.ticker, ticker.toUpperCase()))
    .limit(1);

  if (!rows[0]) throw new AppError(404, `Company with ticker ${ticker} not found`);
  return rows[0].id;
}

// Los campos decimal en Drizzle/MySQL se representan como string
function toDecimal(v: number | null | undefined): string | null {
  if (v == null) return null;
  return v.toString();
}

// Los campos bigint con mode:'number' aceptan number | null
function toBigint(v: number | null | undefined): number | null {
  if (v == null) return null;
  return Math.round(v); // por si viene con decimales del mapper
}

// ─── Income statement upsert ──────────────────────────────────────────────────

async function upsertIncomeStatement(
  db: Awaited<ReturnType<typeof getDb>>,
  companyId: number,
  record: MappedRecord,
  sourceFile?: string,
): Promise<void> {
  const existing = await db
    .select({ id: schema.incomeStatement.id })
    .from(schema.incomeStatement)
    .where(
      and(
        eq(schema.incomeStatement.companyId, companyId),
        eq(schema.incomeStatement.fiscalYear, record.fiscalYear),
        eq(schema.incomeStatement.periodType, 'annual'),
      ),
    )
    .limit(1);

  const values: NewIncomeStatement = {
    companyId,
    fiscalYear:               record.fiscalYear,
    periodType:               'annual',
    currency:                 (record.currency as string) ?? 'USD',
    revenue:                  toBigint(record.revenue),
    costOfRevenue:            toBigint(record.costOfRevenue),
    grossProfit:              toBigint(record.grossProfit),
    grossMarginPct:           toDecimal(record.grossMarginPct),
    researchAndDevelopment:   toBigint(record.researchAndDevelopment),
    sellingGeneralAdmin:      toBigint(record.sellingGeneralAdmin),
    depreciationAmortization: toBigint(record.depreciationAmortization),
    operatingIncome:          toBigint(record.operatingIncome),
    operatingMarginPct:       toDecimal(record.operatingMarginPct),
    interestExpense:          toBigint(record.interestExpense),
    interestIncome:           toBigint(record.interestIncome),
    pretaxIncome:             toBigint(record.pretaxIncome),
    incomeTax:                toBigint(record.incomeTax),
    netIncome:                toBigint(record.netIncome),
    netIncomeTotal:           toBigint(record.netIncomeTotal),
    netMarginPct:             toDecimal(record.netMarginPct),
    sharesBasic:              toBigint(record.sharesBasic),
    sharesDiluted:            toBigint(record.sharesDiluted),
    epsBasic:                 toDecimal(record.epsBasic),
    epsDiluted:               toDecimal(record.epsDiluted),
    ebitda:                   toBigint(record.ebitda),
    sourceFile:               sourceFile ?? null,
  };

  if (existing[0]) {
    await db
      .update(schema.incomeStatement)
      .set(values)
      .where(eq(schema.incomeStatement.id, existing[0].id));
  } else {
    await db.insert(schema.incomeStatement).values(values);
  }
}

// ─── Public ───────────────────────────────────────────────────────────────────

export async function upsertFinancials(
  ticker: string,
  records: MappedRecord[],
  sourceFile?: string,
): Promise<void> {
  const db = await getDb();
  const companyId = await resolveCompanyId(ticker);

  for (const record of records) {
    await upsertIncomeStatement(db, companyId, record, sourceFile);

    // Se agregan cuando sus schemas estén descomentados en index.ts
    // await upsertBalanceSheet(db, companyId, record, sourceFile);
    // await upsertCashFlow(db, companyId, record, sourceFile);
  }
}