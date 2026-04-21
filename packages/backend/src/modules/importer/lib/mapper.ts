import { Parser } from 'expr-eval'
import type { TickerMapping, FieldDef, DirectField } from '../types/mapping.types'

const exprParser = new Parser()

const MAPPER_DEBUG = process.env.MAPPER_DEBUG === 'true'
const debug = (...args: any[]) => MAPPER_DEBUG && console.log('[mapper]', ...args)

function resolveRow(
  rows: Record<string, any>[],
  labelCol: string,
  match: string,
  aliases: string[] = []
): Record<string, any> | undefined {
  const candidates = [match, ...aliases].map(s => s.toLowerCase().trim())
  return rows.find(row => {
    const label = String(row[labelCol] ?? '').toLowerCase().trim()
    if (!label) return false
    return candidates.some(c => label.includes(c) || c.includes(label))
  })
}

function resolveValue(
  row: Record<string, any> | undefined,
  col: string,
  transform?: string
): number | null {
  if (!row) return null
  const v = row[col]
  const n = parseFloat(String(v).replace(/,/g, ''))
  if (isNaN(n)) return null
  if (transform === 'percentage') return Math.round(n * 100 * 100) / 100  // 0.9567 → 95.67
  return n
}

export function applyMapping(
  raw: Record<string, Record<string, any>[]>,
  mapping: TickerMapping
): { records: any[]; warnings: string[] } {
  const warnings: string[] = []
  const yearSets: Record<string, Record<string, number | null>> = {}
  
  for (const [section, config] of Object.entries(mapping.sheets)) {
    const rows = raw[section]

    if (!rows || rows.length === 0) {
      console.warn(`[mapper] Section "${section}" has no rows — skipping`)
      continue
    }

    debug(`Section "${section}" — ${rows.length} rows, fields: ${Object.keys(config.fields).join(', ')}`)

    for (const [fieldName, fieldDef] of Object.entries(config.fields)) {
      const resolved = resolveFieldAllYears(fieldDef, rows, config.labelColumn, config.valueColumns)

      for (const [year, value] of Object.entries(resolved)) {
        if (!yearSets[year]) yearSets[year] = {}
        yearSets[year][fieldName] = value
        if (value === null) {
          const match = fieldDef.type === 'direct' ? fieldDef.match : `calc(${fieldDef.formula})`
          console.warn(`[mapper] value NULL — section="${section}" field="${fieldName}" match="${match}" year=${year}`)
          warnings.push(`${fieldName} not found for year ${year} in ${section}`)
        } else {
          debug(`  ${section}.${fieldName}[${year}] = ${value}`)
        }
      }
    }
  }

  const records = Object.entries(yearSets).map(([year, fields]) => ({
    fiscalYear: parseInt(year),
    ...fields,
  }))

  return { records, warnings }
}

function resolveFieldAllYears(
  fieldDef: FieldDef,
  rows: Record<string, any>[],
  labelCol: string,
  valueCols: Record<string, string>
): Record<string, number | null> {
  if (fieldDef.type === 'direct') {
    const row = resolveRow(rows, labelCol, fieldDef.match, fieldDef.aliases)
    return Object.fromEntries(
      Object.entries(valueCols).map(([year, col]) => [year, resolveValue(row, col, fieldDef.transform)])
    )
  }

  // type === 'calc'
  if (!fieldDef.vars) {
    console.error(`[mapper] calc field is missing "vars" — formula="${fieldDef.formula}" fieldDef=${JSON.stringify(fieldDef)}`)
    return Object.fromEntries(Object.keys(valueCols).map(year => [year, null]))
  }

  const varResolved: Record<string, Record<string, number | null>> = {}
  for (const [varName, varDef] of Object.entries(fieldDef.vars)) {
    varResolved[varName] = resolveFieldAllYears(
      varDef as DirectField, rows, labelCol, valueCols
    )
  }

  return Object.fromEntries(
    Object.keys(valueCols).map(year => {
      const scope: Record<string, number> = {}
      for (const [v, vals] of Object.entries(varResolved)) {
        if (vals[year] == null) {
          console.warn(`[mapper] calc var "${v}" is null for year=${year}, formula="${fieldDef.formula}" — skipping`)
          return [year, null]
        }
        scope[v] = vals[year] as number
      }
      try {
        return [year, exprParser.evaluate(fieldDef.formula, scope)]
      } catch (err) {
        console.error(`[mapper] formula eval failed formula="${fieldDef.formula}" year=${year} scope=${JSON.stringify(scope)}`, err)
        return [year, null]
      }
    })
  )
}