import { eq, desc } from 'drizzle-orm';
import { getDb, schema } from '../../db/connection';

export async function getFinancialData(companyId: number) {
  const db = await getDb();

  const [balance, income, cashflow] = await Promise.all([
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
  ]);

  return { balance, income, cashflow };
}
