export interface WeissChartSeriesPoint {
  date: string;
  close: number | null;
  annualDividend: number | null;
  dividendYield: number | null;
  fairPrice: number | null;
  undervaluePrice: number | null;
  overvaluePrice: number | null;
}

export interface WeissChartYearlyPoint {
  year: number;
  dividend: number;
  minPrice: number | null;
  maxPrice: number | null;
  minYield: number | null;
  maxYield: number | null;
  closingPrice: number | null;
  fairPrice: number | null;
  undervaluePrice: number | null;
  overvaluePrice: number | null;
  isComplete: boolean;
}

export interface WeissChartValuation {
  minYieldPeriod: number | null;
  maxYieldPeriod: number | null;
  avgYieldPeriod: number | null;
  overvalueYield: number | null;
  undervalueYield: number | null;
  fairYield: number | null;
  currentPrice: number | null;
  currentAnnualDividend: number | null;
  currentYield: number | null;
  currentFairPrice: number | null;
  currentUndervaluePrice: number | null;
  currentOvervaluePrice: number | null;
  zone: 'undervalued' | 'fair' | 'overvalued' | 'unknown';
}

export interface WeissChartData {
  symbol: string;
  yahooSymbol: string;
  currency: string | null;
  exchangeName: string | null;
  period: {
    from: string;
    to: string;
    startTimestamp: number;
    endTimestamp: number;
  };
  methodology: {
    description: string;
    dividendBasis: string;
    priceBasis: string;
    periodYields: string;
    undervalueBand: string;
    overvalueBand: string;
    fairPrice: string;
  };
  series: WeissChartSeriesPoint[];
  yearlyData: WeissChartYearlyPoint[];
  yearlyExtremes: WeissChartYearlyPoint[];
  valuation: WeissChartValuation;
}
