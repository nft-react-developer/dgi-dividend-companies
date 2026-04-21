export interface BalanceSheetRecord {
  id: number;
  companyId: number;
  fiscalYear: number;
  periodType: string;
  currency: string;
  cashAndEquivalents: number | null;
  shortTermInvestments: number | null;
  accountsReceivable: number | null;
  inventory: number | null;
  otherCurrentAssets: number | null;
  totalCurrentAssets: number | null;
  propertyPlantEquipmentNet: number | null;
  goodwill: number | null;
  intangibleAssets: number | null;
  longTermInvestments: number | null;
  otherNonCurrentAssets: number | null;
  totalNonCurrentAssets: number | null;
  totalAssets: number | null;
  accountsPayable: number | null;
  shortTermDebt: number | null;
  currentPortionLongTermDebt: number | null;
  otherCurrentLiabilities: number | null;
  totalCurrentLiabilities: number | null;
  longTermDebt: number | null;
  deferredTaxLiabilities: number | null;
  otherNonCurrentLiabilities: number | null;
  totalNonCurrentLiabilities: number | null;
  totalLiabilities: number | null;
  commonStock: number | null;
  retainedEarnings: number | null;
  additionalPaidInCapital: number | null;
  treasuryStock: number | null;
  accumulatedOtherComprehensiveIncome: number | null;
  totalEquity: number | null;
  totalLiabilitiesAndEquity: number | null;
  debtToEquity: string | null;
  currentRatio: string | null;
  bookValuePerShare: string | null;
}

export interface IncomeStatementRecord {
  id: number;
  companyId: number;
  fiscalYear: number;
  periodType: string;
  currency: string;
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  grossMarginPct: string | null;
  researchAndDevelopment: number | null;
  sellingGeneralAdmin: number | null;
  depreciationAmortization: number | null;
  otherOperatingExpenses: number | null;
  operatingIncome: number | null;
  operatingMarginPct: string | null;
  interestExpense: number | null;
  interestIncome: number | null;
  otherNonOperating: number | null;
  pretaxIncome: number | null;
  incomeTax: number | null;
  effectiveTaxRatePct: string | null;
  netIncome: number | null;
  minorityInterest: number | null;
  netIncomeTotal: number | null;
  netMarginPct: string | null;
  sharesBasic: number | null;
  sharesDiluted: number | null;
  epsBasic: string | null;
  epsDiluted: string | null;
  ebitda: number | null;
  adjustedNetIncome: number | null;
  adjustedEps: string | null;
}

export interface CashFlowRecord {
  id: number;
  companyId: number;
  fiscalYear: number;
  periodType: string;
  currency: string;
  netIncome: number | null;
  depreciationAmortization: number | null;
  stockBasedCompensation: number | null;
  changesInWorkingCapital: number | null;
  otherOperatingActivities: number | null;
  netCashFromOperations: number | null;
  capitalExpenditures: number | null;
  acquisitions: number | null;
  purchasesOfInvestments: number | null;
  salesOfInvestments: number | null;
  otherInvestingActivities: number | null;
  netCashFromInvesting: number | null;
  debtRepayment: number | null;
  issuanceOfDebt: number | null;
  issuanceOfStock: number | null;
  repurchaseOfStock: number | null;
  dividendsPaid: number | null;
  otherFinancingActivities: number | null;
  netCashFromFinancing: number | null;
  netChangeInCash: number | null;
  freeCashFlow: number | null;
}

export interface FinancialData {
  balance: BalanceSheetRecord[];
  income: IncomeStatementRecord[];
  cashflow: CashFlowRecord[];
}
