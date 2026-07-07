import { eq, desc, and, or, isNull } from 'drizzle-orm';
import { getDb, schema } from '../../db/connection';

type FmtType = 'currency' | 'pct' | 'ratio' | 'shares';

function buildHintMap(
  hints: { statementType: string; canonicalField: string; displayFormat: string; companyId: number | null }[],
  stmtType: string,
  cid: number,
): Record<string, FmtType> {
  const map: Record<string, FmtType> = {};
  for (const h of hints)
    if (h.statementType === stmtType && h.companyId === null)
      map[h.canonicalField] = h.displayFormat as FmtType;
  for (const h of hints)
    if (h.statementType === stmtType && h.companyId === cid)
      map[h.canonicalField] = h.displayFormat as FmtType;
  return map;
}

export async function getFinancialData(companyId: number) {
  const db = await getDb();

  const [balance, income, cashflow, rawHints] = await Promise.all([
    db
      .select()
      .from(schema.balanceSheet)
      .where(eq(schema.balanceSheet.companyId, companyId))
      .orderBy(desc(schema.balanceSheet.fiscalYear)),
    db
      .select()
      .from(schema.incomeStatement)
      .where(eq(schema.incomeStatement.companyId, companyId))
      .orderBy(desc(schema.incomeStatement.fiscalYear)),
    db
      .select()
      .from(schema.cashFlowStatement)
      .where(eq(schema.cashFlowStatement.companyId, companyId))
      .orderBy(desc(schema.cashFlowStatement.fiscalYear)),
    db
      .select({
        statementType:  schema.fieldMappers.statementType,
        canonicalField: schema.fieldMappers.canonicalField,
        displayFormat:  schema.fieldMappers.displayFormat,
        companyId:      schema.fieldMappers.companyId,
      })
      .from(schema.fieldMappers)
      .where(
        and(
          eq(schema.fieldMappers.targetColumn, 'extended_metrics'),
          eq(schema.fieldMappers.isActive, true),
          or(
            eq(schema.fieldMappers.companyId, companyId),
            isNull(schema.fieldMappers.companyId),
          ),
        )
      ),
  ]);

  const formatHints = {
    balance:  buildHintMap(rawHints, 'balance_sheet',    companyId),
    income:   buildHintMap(rawHints, 'income_statement', companyId),
    cashflow: buildHintMap(rawHints, 'cash_flow',        companyId),
  };

  return { balance, income, cashflow, formatHints };
}
