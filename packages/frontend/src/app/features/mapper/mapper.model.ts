export type StatementType = 'income_statement' | 'balance_sheet' | 'cash_flow' | 'dividends';
export type TransformType = 'none' | 'negate' | 'abs' | 'thousands' | 'millions' | 'pct_to_decimal';
export type DisplayFormat  = 'currency' | 'pct' | 'ratio' | 'shares';

export interface FieldMapper {
  id:             number;
  companyId:      number | null;
  companyTicker?: string | null;
  companyName?:   string | null;
  statementType:  StatementType;
  rawLabel:       string;
  canonicalField: string;
  targetTable:    string;
  targetColumn:   string;
  transform:      TransformType;
  displayFormat:  DisplayFormat;
  priority:       number;
  isActive:       boolean;
  notes?:         string | null;
  createdAt?:     string;
}

export interface MapperFilters {
  search?:        string;
  companyId?:     number;
  statementType?: StatementType;
  isActive?:      boolean;
}

export interface CreateMapperPayload {
  companyId?:     number | null;
  statementType:  StatementType;
  rawLabel:       string;
  canonicalField: string;
  targetTable:    string;
  targetColumn:   string;
  transform:      TransformType;
  displayFormat:  DisplayFormat;
  priority:       number;
  isActive:       boolean;
  notes?:         string;
}

export type UpdateMapperPayload = Partial<CreateMapperPayload>;

export const STATEMENT_TYPES: { label: string; value: StatementType }[] = [
  { label: 'Income Statement', value: 'income_statement' },
  { label: 'Balance Sheet',    value: 'balance_sheet'    },
  { label: 'Cash Flow',        value: 'cash_flow'        },
  { label: 'Dividends',        value: 'dividends'        },
];

export const DISPLAY_FORMAT_TYPES: { label: string; value: DisplayFormat }[] = [
  { label: 'Currency ($)',   value: 'currency' },
  { label: 'Percentage (%)', value: 'pct'      },
  { label: 'Ratio',          value: 'ratio'    },
  { label: 'Shares',         value: 'shares'   },
];

export const TRANSFORM_TYPES: { label: string; value: TransformType }[] = [
  { label: 'None',            value: 'none'           },
  { label: 'Negate',         value: 'negate'         },
  { label: 'Absolute value', value: 'abs'            },
  { label: 'Thousands (÷1k)',  value: 'thousands'    },
  { label: 'Millions (÷1M)',   value: 'millions'     },
  { label: '% → Decimal',    value: 'pct_to_decimal' },
];
