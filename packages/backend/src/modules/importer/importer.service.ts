import { AppError } from '../../shared/errors/error-handler'
import { parseWorkbook } from './lib/parser'
import { applyMapping } from './lib/mapper'
import { validateDGI } from './lib/validator';
import * as repo from './importer.repository'
import { loadMapping } from './lib/mapping-loader'
import type { ImportResultDto } from './importer.dto'

export async function importFinancials(
  ticker: string,
  buffer: Buffer
): Promise<ImportResultDto> {
  const mapping = await loadMapping(ticker)
  if (!mapping) throw new AppError(404, `No mapping config found for ticker ${ticker}`)

  // 1. Parsear las 3 hojas
  const raw = parseWorkbook(buffer, mapping)

  // 2. Mapear campos por nombre
  const { records, warnings } = applyMapping(raw, mapping)

  // 3. Validar criterios DGI
  const errors: string[] = []
  for (const record of records) {
    const v = validateDGI(record)
    if (v.warnings.length) warnings.push(...v.warnings.map(w => `[${record.fiscalYear}] ${w}`))
  }

  // 4. Upsert en BD
  await repo.upsertFinancials(ticker, records)

  return { ticker, rowsImported: records.length, warnings, errors }
}