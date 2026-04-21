export type FieldTransform = 'thousands' | 'millions' | 'percentage' | 'none'

export type DirectField = {
  type: 'direct'
  match: string
  aliases?: string[]
  transform?: FieldTransform
}

export type CalcField = {
  type: 'calc'
  formula: string           // ej: "a + b", "a / b * 100"
  vars: Record<string, DirectField>
}

export type FieldDef = DirectField | CalcField

export type SheetMapping = {
  sheetIndex: number
  labelColumn: string       // ej: "A" — columna donde están los nombres de fila
  valueColumns: Record<string, string>  // { "2023": "B", "2022": "C" }
  fields: Record<string, FieldDef>
}

export type TickerMapping = {
  ticker: string
  sheets: {
    balance?: SheetMapping
    income?: SheetMapping
    cashflow?: SheetMapping
  }
}

// types/mapping.types.ts

export interface MappedRecord {
  fiscalYear: number;
  currency?: string;          // ← string explícito, fuera del index numérico

  // income statement — bigint en DB
  revenue?:                   number | null;
  costOfRevenue?:             number | null;
  grossProfit?:               number | null;
  researchAndDevelopment?:    number | null;
  sellingGeneralAdmin?:       number | null;
  depreciationAmortization?:  number | null;
  operatingIncome?:           number | null;
  interestExpense?:           number | null;
  interestIncome?:            number | null;
  pretaxIncome?:              number | null;
  incomeTax?:                 number | null;
  netIncome?:                 number | null;
  netIncomeTotal?:            number | null;
  sharesBasic?:               number | null;
  sharesDiluted?:             number | null;
  ebitda?:                    number | null;

  // income statement — decimal en DB (string en Drizzle)
  grossMarginPct?:            number | null;
  operatingMarginPct?:        number | null;
  netMarginPct?:              number | null;
  epsBasic?:                  number | null;
  epsDiluted?:                number | null;

  // campos derivados post-mapping
  payoutRatio?:               number | null;
  debtRatio?:                 number | null;

  // cualquier campo extra del mapper — solo numérico
  [key: string]: number | null | undefined | string;
}