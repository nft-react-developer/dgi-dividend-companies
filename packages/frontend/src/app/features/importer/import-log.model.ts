export interface ImportLog {
  id:             number;
  companyId:      number;
  fiscalYear:     number;
  periodType:     'annual' | 'q1' | 'q2' | 'q3' | 'q4';
  sourceFile:     string;
  sourceType:     string;
  parseEngine:    string;
  status:         'pending' | 'parsing' | 'mapped' | 'stored' | 'error';
  fieldsExtracted: number;
  fieldsMapped:   number;
  fieldsFailed:   number;
  errorMessage?:  string | null;
  importedBy?:    string | null;
  startedAt?:     string | null;
  finishedAt?:    string | null;
}

export interface UploadReportPayload {
  companyId:  number;
  fiscalYear: number;
  periodType: 'annual' | 'q1' | 'q2' | 'q3' | 'q4';
  sourceType: 'pdf_annual' | 'pdf_10k' | 'pdf_6k' | 'manual' | 'api_edgar';
}