// src/modules/importer/importer.repository.ts

import { eq, and } from 'drizzle-orm';
import { getDb, schema } from '../../db/connection';
import { AppError } from '../../shared/errors/error-handler';
import type { NewIncomeStatement } from '../../db/schema/income-statement.schema';
import type { NewBalanceSheet } from '../../db/schema/balance-sheet.schema';
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

// ─── Balance sheet upsert ─────────────────────────────────────────────────────

async function upsertBalanceSheet(
  db: Awaited<ReturnType<typeof getDb>>,
  companyId: number,
  record: MappedRecord,
  sourceFile?: string,
): Promise<void> {
  const existing = await db
    .select({ id: schema.balanceSheet.id })
    .from(schema.balanceSheet)
    .where(
      and(
        eq(schema.balanceSheet.companyId, companyId),
        eq(schema.balanceSheet.fiscalYear, record.fiscalYear),
        eq(schema.balanceSheet.periodType, 'annual'),
      ),
    )
    .limit(1);

  const r = record as Record<string, number | null | undefined | string>;

  const values: NewBalanceSheet = {
    companyId,
    fiscalYear:                       record.fiscalYear,
    periodType:                       'annual',
    currency:                         (record.currency as string) ?? 'USD',
    cashAndEquivalents:               toBigint(r.cashAndEquivalents as number),
    shortTermInvestments:             toBigint(r.shortTermInvestments as number),
    accountsReceivable:               toBigint(r.accountsReceivable as number),
    inventory:                        toBigint(r.inventory as number),
    otherCurrentAssets:               toBigint(r.otherCurrentAssets as number),
    totalCurrentAssets:               toBigint(r.totalCurrentAssets as number),
    propertyPlantEquipmentNet:        toBigint(r.propertyPlantEquipmentNet as number),
    goodwill:                         toBigint(r.goodwill as number),
    intangibleAssets:                 toBigint(r.intangibleAssets as number),
    longTermInvestments:              toBigint(r.longTermInvestments as number),
    otherNonCurrentAssets:            toBigint(r.otherNonCurrentAssets as number),
    totalNonCurrentAssets:            toBigint(r.totalNonCurrentAssets as number),
    totalAssets:                      toBigint(r.totalAssets as number),
    accountsPayable:                  toBigint(r.accountsPayable as number),
    shortTermDebt:                    toBigint(r.shortTermDebt as number),
    currentPortionLongTermDebt:       toBigint(r.currentPortionLongTermDebt as number),
    otherCurrentLiabilities:          toBigint(r.otherCurrentLiabilities as number),
    totalCurrentLiabilities:          toBigint(r.totalCurrentLiabilities as number),
    longTermDebt:                     toBigint(r.longTermDebt as number),
    deferredTaxLiabilities:           toBigint(r.deferredTaxLiabilities as number),
    otherNonCurrentLiabilities:       toBigint(r.otherNonCurrentLiabilities as number),
    totalNonCurrentLiabilities:       toBigint(r.totalNonCurrentLiabilities as number),
    totalLiabilities:                 toBigint(r.totalLiabilities as number),
    commonStock:                      toBigint(r.commonStock as number),
    retainedEarnings:                 toBigint(r.retainedEarnings as number),
    additionalPaidInCapital:          toBigint(r.additionalPaidInCapital as number),
    treasuryStock:                    toBigint(r.treasuryStock as number),
    accumulatedOtherComprehensiveIncome: toBigint(r.accumulatedOtherComprehensiveIncome as number),
    totalEquity:                      toBigint(r.totalEquity as number),
    totalLiabilitiesAndEquity:        toBigint(r.totalLiabilitiesAndEquity as number),
    sourceFile:                       sourceFile ?? null,
  };

  if (existing[0]) {
    await db
      .update(schema.balanceSheet)
      .set(values)
      .where(eq(schema.balanceSheet.id, existing[0].id));
  } else {
    await db.insert(schema.balanceSheet).values(values);
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
    await upsertBalanceSheet(db, companyId, record, sourceFile);

    // await upsertCashFlow(db, companyId, record, sourceFile);
  }
}