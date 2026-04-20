export interface ImportResult {
  ticker:       string;
  rowsImported: number;
  warnings:     string[];
  errors:       string[];
}