import { AppError } from '../../shared/errors/error-handler';
import * as repo from './companies.repository';
import type { CreateCompanyDto, UpdateCompanyDto, CompanyQueryDto } from './companies.dto';

export async function getCompanies(query: CompanyQueryDto) {
  return repo.findAllCompanies(query);
}

export async function getCompanyById(id: number) {
  const company = await repo.findCompanyById(id);
  if (!company) {
    throw new AppError(404, `Company with id ${id} not found`);
  }
  return company;
}

export async function createCompany(data: CreateCompanyDto) {
  // Check ticker uniqueness
  const existing = await repo.findCompanyByTicker(data.ticker);
  if (existing) {
    throw new AppError(409, `Company with ticker ${data.ticker} already exists`);
  }
  return repo.createCompany(data);
}

export async function updateCompany(id: number, data: UpdateCompanyDto) {
  // Ensure company exists
  await getCompanyById(id);

  // If ticker is being updated, check uniqueness
  if (data.ticker) {
    const existing = await repo.findCompanyByTicker(data.ticker);
    if (existing && existing.id !== id) {
      throw new AppError(409, `Ticker ${data.ticker} is already taken`);
    }
  }

  return repo.updateCompany(id, data);
}

export async function deleteCompany(id: number) {
  await getCompanyById(id);
  await repo.deleteCompany(id);
}