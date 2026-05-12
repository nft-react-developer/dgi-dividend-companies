import * as XLSX from 'xlsx'
import type { TickerMapping } from '../types/mapping.types'

export function parseWorkbook(
  buffer: Buffer,
  mapping: TickerMapping
): Record<string, Record<string, any>[]> {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const result: Record<string, Record<string, any>[]> = {}

  for (const [section, config] of Object.entries(mapping.sheets)) {
    const ws = wb.Sheets[wb.SheetNames[config.sheetIndex]]
    if (!ws) throw new Error(`Sheet index ${config.sheetIndex} not found for section ${section}`)

    if (section === 'cashflow') {
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { header: 'A', defval: null })
      const dividendRow = rows.find(r => String(r['A'] ?? '').toLowerCase().includes('dividendo'))
      if (dividendRow) {
        console.log('[parser:debug] Dividendos row (raw):', JSON.stringify(dividendRow))
        // dump raw xlsx cell objects for each value column
        for (const [year, col] of Object.entries(config.valueColumns)) {
          const rowIdx = rows.indexOf(dividendRow) + 1 // xlsx rows are 1-based
          const cellAddr = `${col}${rowIdx + 1}` // +1 because sheet_to_json row 0 = xlsx row 1 (no header offset here)
          console.log(`[parser:debug] cell ${cellAddr} (${year}):`, JSON.stringify(ws[cellAddr]))
        }
      }
      result[section] = rows
      continue
    }

    result[section] = XLSX.utils.sheet_to_json(ws, { header: 'A', defval: null })
  }

  return result
}