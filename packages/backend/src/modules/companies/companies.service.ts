import { AppError } from '../../shared/errors/error-handler';
import * as repo    from './companies.repository';
import type { CreateCompanyDto, UpdateCompanyDto, CompanyQueryDto } from './companies.dto';

export async function getCompanies(query: CompanyQueryDto) {
  return repo.findAllCompanies(query);
}

export async function getCompanyById(id: number) {
  const company = await repo.findCompanyById(id);
  if (!company) throw new AppError(404, `Company with id ${id} not found`);
  return company;
}

export async function getCompanyLogo(id: number) {
  const logo = await repo.findCompanyLogo(id);
  if (!logo?.data) throw new AppError(404, `No logo found for company ${id}`);
  return { data: logo.data, mimeType: logo.mimeType ?? 'image/png' };
}

export async function createCompany(data: CreateCompanyDto) {
  const existing = await repo.findCompanyByTicker(data.ticker);
  if (existing) throw new AppError(409, `Ticker ${data.ticker} already exists`);
  return repo.createCompany(data);
}

export async function uploadCompanyLogo(id: number, buffer: Buffer, mimeType: string) {
  await getCompanyById(id);
  return repo.updateCompanyLogo(id, buffer, mimeType);
}

export async function updateCompany(id: number, data: UpdateCompanyDto) {
  await getCompanyById(id);
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