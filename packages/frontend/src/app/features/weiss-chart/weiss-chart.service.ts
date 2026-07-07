import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import type { WeissChartData } from './weiss-chart.model';

@Injectable({ providedIn: 'root' })
export class WeissChartService {
  private api = inject(ApiService);

  async getWeissChart(ticker: string) {
    const res = await firstValueFrom(
      this.api.get<{ data: WeissChartData }>(`/weiss-chart/${encodeURIComponent(ticker)}`)
    );
    return res.data;
  }
}
