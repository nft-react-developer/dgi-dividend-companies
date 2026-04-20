// src/modules/importer/lib/validator.ts

import type { MappedRecord } from '../types/mapping.types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

// ─── Thresholds DGI (Dividends Still Don't Lie) ───────────────────────────────

const THRESHOLDS = {
  payoutRatioMax:         0.50,
  payoutRatioMaxUtility:  0.75,
  debtRatioMax:           0.50,
  debtRatioMaxUtility:    0.75,
  payoutDangerThreshold:  1.00,
} as const;

// ─── Helper ───────────────────────────────────────────────────────────────────

function num(v: number | null | undefined): number | null {
  if (v == null || isNaN(v)) return null;
  return v;
}

// ─── Validador principal ──────────────────────────────────────────────────────

export function validateDGI(
  record: MappedRecord,
  isUtility = false,
): ValidationResult {
  const warnings: string[] = [];

  const payoutMax = isUtility ? THRESHOLDS.payoutRatioMaxUtility : THRESHOLDS.payoutRatioMax;
  const debtMax   = isUtility ? THRESHOLDS.debtRatioMaxUtility   : THRESHOLDS.debtRatioMax;

  // ── 1. Payout ratio ────────────────────────────────────────────────────────
  const payout = num(record.payoutRatio);

  if (payout === null) {
    warnings.push('Payout ratio could not be calculated — missing dividendPerShare or epsBasic');
  } else if (payout > THRESHOLDS.payoutDangerThreshold) {
    warnings.push(`Dividend in danger: payout ${(payout * 100).toFixed(1)}% exceeds earnings (>100%)`);
  } else if (payout > payoutMax) {
    warnings.push(`Payout ratio ${(payout * 100).toFixed(1)}% exceeds ${(payoutMax * 100).toFixed(0)}% threshold`);
  }

  // ── 2. Debt ratio ──────────────────────────────────────────────────────────
  const debtRatio = num(record.debtRatio);

  if (debtRatio === null) {
    warnings.push('Debt ratio could not be calculated — missing totalDebt or totalAssets');
  } else if (debtRatio > debtMax) {
    warnings.push(`Debt ratio ${(debtRatio * 100).toFixed(1)}% exceeds ${(debtMax * 100).toFixed(0)}% threshold`);
  }

  // ── 3. EPS negativo ────────────────────────────────────────────────────────
  const eps = num(record.epsBasic ?? record.epsDiluted);

  if (eps !== null && eps <= 0) {
    warnings.push(`Negative EPS (${eps.toFixed(2)}) — company not profitable this period`);
  }

  // ── 4. Net margin negativo ─────────────────────────────────────────────────
  const netMargin = num(record.netMarginPct);

  if (netMargin !== null && netMargin < 0) {
    warnings.push(`Negative net margin (${(netMargin * 100).toFixed(2)}%)`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}