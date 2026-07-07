import YahooFinance from 'yahoo-finance2';
import { AppError } from '../../shared/errors/error-handler';
import { findCompanyByTicker } from '../companies/companies.repository';
import type { WeissChartQueryDto } from './weiss-chart.dto';

const yahooFinance = new YahooFinance();

type YahooChartQuote = {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  adjclose?: number | null;
};

type YahooChartDividend = {
  date: Date;
  amount: number;
};

type YahooChartResult = {
  meta: {
    symbol: string;
    currency?: string | null;
    exchangeName?: string | null;
    regularMarketPrice?: number | null;
  };
  quotes: YahooChartQuote[];
  events?: {
    dividends?: YahooChartDividend[];
  };
};

export interface WeissChartPricePoint {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  adjClose: number | null;
  volume: number | null;
}

export interface WeissChartDividendPoint {
  date: string;
  amount: number;
}

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
  prices: WeissChartPricePoint[];
  dividends: WeissChartDividendPoint[];
  yearlyData: WeissChartYearlyPoint[];
  yearlyExtremes: WeissChartYearlyPoint[];
  series: WeissChartSeriesPoint[];
  valuation: WeissChartValuation;
}

type NormalizedDividend = WeissChartDividendPoint & { ts: number; year: number };
type NormalizedPrice = WeissChartPricePoint & { ts: number; year: number };

type PeriodYields = {
  minYieldPeriod: number | null;
  maxYieldPeriod: number | null;
  avgYieldPeriod: number | null;
};

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateOnly(value: string, field: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `Invalid ${field} date`);
  }
  return date;
}

function addUtcYears(date: Date, years: number) {
  return new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate()));
}

function defaultFromDate(to: Date) {
  return addUtcYears(to, -10);
}

function resolvePeriod(query: WeissChartQueryDto) {
  const toValue   = query.to ?? query.endDate;
  const fromValue = query.from ?? query.startDate;

  const to   = toValue ? parseDateOnly(toValue, 'to') : new Date();
  const from = fromValue ? parseDateOnly(fromValue, 'from') : defaultFromDate(to);

  if (from.getTime() > to.getTime()) {
    throw new AppError(400, '`from` date must be before or equal to `to` date');
  }

  const startTimestamp = Math.floor(from.getTime() / 1000);
  const endTimestamp   = Math.floor(to.getTime() / 1000);

  return { from, to, startTimestamp, endTimestamp };
}

function normalizePrices(quotes: YahooChartQuote[]): NormalizedPrice[] {
  return quotes
    .filter(q => q.date instanceof Date)
    .map(q => {
      const date = toDateOnly(q.date);
      return {
        date,
        ts:       q.date.getTime(),
        year:     q.date.getUTCFullYear(),
        open:     q.open,
        high:     q.high,
        low:      q.low,
        close:    q.close,
        adjClose: q.adjclose ?? null,
        volume:   q.volume,
      };
    })
    .sort((a, b) => a.ts - b.ts);
}

function normalizeDividends(dividends: YahooChartDividend[]): NormalizedDividend[] {
  return dividends
    .filter(d => d.date instanceof Date && d.amount > 0)
    .map(d => ({
      date:   toDateOnly(d.date),
      ts:     d.date.getTime(),
      year:   d.date.getUTCFullYear(),
      amount: d.amount,
    }))
    .sort((a, b) => a.ts - b.ts);
}

function round(value: number | null, digits = 4) {
  if (value == null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function priceForYield(annualDividend: number | null, targetYield: number | null) {
  if (!annualDividend || !targetYield || targetYield <= 0) return null;
  return annualDividend / targetYield;
}

function yieldRatio(annualDividend: number | null, price: number | null) {
  if (!annualDividend || !price || price <= 0) return null;
  return annualDividend / price;
}

function groupByYear<T extends { year: number }>(items: T[]) {
  const byYear = new Map<number, T[]>();
  for (const item of items) {
    const bucket = byYear.get(item.year) ?? [];
    bucket.push(item);
    byYear.set(item.year, bucket);
  }
  return byYear;
}

function sumDividendsByYear(dividends: NormalizedDividend[]) {
  const byYear = new Map<number, number>();
  for (const dividend of dividends) {
    byYear.set(dividend.year, (byYear.get(dividend.year) ?? 0) + dividend.amount);
  }
  return byYear;
}

function isCompleteYear(year: number, to: Date) {
  const endYear = to.getUTCFullYear();
  if (year < endYear) return true;
  return to.getUTCMonth() === 11 && to.getUTCDate() === 31;
}

function buildYearlyData(prices: NormalizedPrice[], dividends: NormalizedDividend[], from: Date, to: Date): WeissChartYearlyPoint[] {
  const pricesByYear = groupByYear(prices.filter(p => p.close != null && p.close > 0));
  const dividendsByYear = sumDividendsByYear(dividends);
  const startYear = from.getUTCFullYear();
  const endYear = to.getUTCFullYear();
  const yearlyData: WeissChartYearlyPoint[] = [];
  let lastCompleteYearDividend: number | null = null;

  for (let year = startYear; year <= endYear; year += 1) {
    const realDividend = dividendsByYear.get(year) ?? 0;
    const isComplete = isCompleteYear(year, to);
    const dividend = isComplete
      ? realDividend
      : (lastCompleteYearDividend ?? realDividend);
    const yearlyPrices = pricesByYear.get(year) ?? [];
    const closes = yearlyPrices.map(p => p.close).filter((value): value is number => value != null && value > 0);
    const lastPrice = yearlyPrices.length ? yearlyPrices[yearlyPrices.length - 1].close : null;
    const minPrice = closes.length ? Math.min(...closes) : null;
    const maxPrice = closes.length ? Math.max(...closes) : null;

    if (isComplete && realDividend > 0) {
      lastCompleteYearDividend = realDividend;
    }

    yearlyData.push({
      year,
      dividend: round(dividend, 2) ?? 0,
      minPrice: round(minPrice, 2),
      maxPrice: round(maxPrice, 2),
      minYield: round(yieldRatio(dividend, maxPrice), 4),
      maxYield: round(yieldRatio(dividend, minPrice), 4),
      closingPrice: round(lastPrice, 2),
      fairPrice: null,
      undervaluePrice: null,
      overvaluePrice: null,
      isComplete,
    });
  }

  return yearlyData;
}

function resolvePeriodYields(yearlyData: WeissChartYearlyPoint[]): PeriodYields {
  let candidates = yearlyData.filter(d => d.isComplete && d.dividend > 0 && d.minYield != null && d.maxYield != null);
  if (!candidates.length) {
    candidates = yearlyData.filter(d => d.dividend > 0 && d.minYield != null && d.maxYield != null);
  }

  if (!candidates.length) {
    return { minYieldPeriod: null, maxYieldPeriod: null, avgYieldPeriod: null };
  }

  const minYieldPeriod = Math.min(...candidates.map(d => d.minYield as number));
  const maxYieldPeriod = Math.max(...candidates.map(d => d.maxYield as number));
  const avgYieldPeriod = (maxYieldPeriod + minYieldPeriod) / 2;

  return {
    minYieldPeriod: round(minYieldPeriod, 4),
    maxYieldPeriod: round(maxYieldPeriod, 4),
    avgYieldPeriod: round(avgYieldPeriod, 4),
  };
}

function addBandsToYearlyData(yearlyData: WeissChartYearlyPoint[], yields: PeriodYields): WeissChartYearlyPoint[] {
  return yearlyData.map(d => ({
    ...d,
    fairPrice: round(priceForYield(d.dividend, yields.avgYieldPeriod), 2),
    undervaluePrice: round(priceForYield(d.dividend, yields.maxYieldPeriod), 2),
    overvaluePrice: round(priceForYield(d.dividend, yields.minYieldPeriod), 2),
  }));
}

function buildSeries(prices: NormalizedPrice[], yearlyData: WeissChartYearlyPoint[]): WeissChartSeriesPoint[] {
  const yearlyByYear = new Map(yearlyData.map(d => [d.year, d]));

  return prices.map(price => {
    const yearly = yearlyByYear.get(price.year);
    const annualDividend = yearly?.dividend && yearly.dividend > 0 ? yearly.dividend : null;

    return {
      date:            price.date,
      close:           round(price.close, 2),
      annualDividend,
      dividendYield:   round(yieldRatio(annualDividend, price.close), 4),
      fairPrice:       yearly?.fairPrice ?? null,
      undervaluePrice: yearly?.undervaluePrice ?? null,
      overvaluePrice:  yearly?.overvaluePrice ?? null,
    };
  });
}

function classifyZone(currentPrice: number | null, undervaluePrice: number | null, overvaluePrice: number | null): WeissChartValuation['zone'] {
  if (currentPrice == null || undervaluePrice == null || overvaluePrice == null) return 'unknown';
  if (currentPrice <= undervaluePrice) return 'undervalued';
  if (currentPrice >= overvaluePrice) return 'overvalued';
  return 'fair';
}

export async function getWeissChartData(ticker: string, query: WeissChartQueryDto): Promise<WeissChartData> {
  const { from, to, startTimestamp, endTimestamp } = resolvePeriod(query);
  const company = await findCompanyByTicker(ticker);
  const yahooTicker = company?.tickerYahoo || ticker;

  const result = await yahooFinance.chart(yahooTicker, {
    period1: startTimestamp,
    period2: endTimestamp,
    interval: '1d',
    events: 'dividends',
    return: 'array',
  }, {
    validateResult: false,
  }) as YahooChartResult;

  if (!result?.quotes?.length) {
    throw new AppError(404, 'No Weiss chart data found');
  }

  const prices = normalizePrices(result.quotes)
    .filter(p => p.ts >= from.getTime() && p.ts <= to.getTime());
  const dividends = normalizeDividends(result.events?.dividends ?? [])
    .filter(d => d.ts >= from.getTime() && d.ts <= to.getTime());
  const baseYearlyData = buildYearlyData(prices, dividends, from, to);
  const periodYields = resolvePeriodYields(baseYearlyData);
  const yearlyData = addBandsToYearlyData(baseYearlyData, periodYields);
  const series = buildSeries(prices, yearlyData);
  const current = [...series].reverse().find(p => p.close != null) ?? null;

  return {
    symbol:       company?.ticker ?? ticker,
    yahooSymbol:  result.meta.symbol ?? yahooTicker,
    currency:     result.meta.currency ?? null,
    exchangeName: result.meta.exchangeName ?? null,
    period: {
      from: toDateOnly(from),
      to:   toDateOnly(to),
      startTimestamp,
      endTimestamp,
    },
    methodology: {
      description:    'Geraldine Weiss-style annual yield bands using Yahoo close prices and dividend events.',
      dividendBasis:  'Calendar-year dividend sum from Yahoo dividend events; the incomplete current year uses the last complete-year dividend to avoid artificial band drops.',
      priceBasis:     'Calendar-year minimum and maximum daily close prices.',
      periodYields:   'The current/incomplete year is excluded when resolving period min/max yields; if no complete year exists, all years are used.',
      undervalueBand: 'Annual dividend divided by the maximum yield of the completed period.',
      overvalueBand:  'Annual dividend divided by the minimum yield of the completed period.',
      fairPrice:      'Annual dividend divided by the midpoint between the period maximum and minimum yields.',
    },
    prices: prices.map(({ ts: _ts, year: _year, ...p }) => p),
    dividends: dividends.map(({ ts: _ts, year: _year, ...d }) => d),
    yearlyData,
    yearlyExtremes: yearlyData,
    series,
    valuation: {
      minYieldPeriod:     periodYields.minYieldPeriod,
      maxYieldPeriod:     periodYields.maxYieldPeriod,
      avgYieldPeriod:     periodYields.avgYieldPeriod,
      overvalueYield:     periodYields.minYieldPeriod,
      undervalueYield:    periodYields.maxYieldPeriod,
      fairYield:          periodYields.avgYieldPeriod,
      currentPrice:       current?.close ?? null,
      currentAnnualDividend: current?.annualDividend ?? null,
      currentYield:       current?.dividendYield ?? null,
      currentFairPrice:   current?.fairPrice ?? null,
      currentUndervaluePrice: current?.undervaluePrice ?? null,
      currentOvervaluePrice:  current?.overvaluePrice ?? null,
      zone: classifyZone(current?.close ?? null, current?.undervaluePrice ?? null, current?.overvaluePrice ?? null),
    },
  };
}
