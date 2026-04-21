import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { FinancialData } from './financial-data.model';

@Injectable({ providedIn: 'root' })
export class FinancialDataService {
  private readonly base = `${environment.apiUrl}/financial-data`;

  constructor(private http: HttpClient) {}

  async getFinancialData(companyId: number): Promise<FinancialData> {
    const res = await firstValueFrom(
      this.http.get<{ data: FinancialData }>(`${this.base}/${companyId}`)
    );
    return res.data;
  }
}
