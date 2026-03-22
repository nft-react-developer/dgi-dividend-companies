export interface Company {
  id:            number;
  ticker:        string;
  isin?:         string;
  name:          string;
  sectorId:      number;
  sectorCode?:   string;
  sectorName?:   string;
  industry?:     string;
  countryIso:    string;
  currency:      string;
  exchange?:     string;
  hasLogo?:      string | null;
  fiscalYearEnd: number;
  isActive:      boolean;
  createdAt?:    string;
  updatedAt?:    string;
}

export interface CompanyFilters {
  search?:   string;
  sector?:   string;
  isActive?: boolean;
}

export interface CreateCompanyPayload {
  ticker:        string;
  isin?:         string;
  name:          string;
  sectorId:      number;
  industry?:     string;
  countryIso:    string;
  currency:      string;
  exchange?:     string;
  fiscalYearEnd: number;
  isActive:      boolean;
}

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;