import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';
import type { ImportResult } from './importer.model';

@Injectable()
export class ImporterService {
  private readonly base = `${environment.apiUrl}/importer`;

  loading = signal(false);
  result  = signal<ImportResult | null>(null);

  constructor(
    private http: HttpClient,
    private message: MessageService,
  ) {}

  import(ticker: string, file: File): Promise<boolean> {
    return new Promise(resolve => {
      this.loading.set(true);
      this.result.set(null);

      const form = new FormData();
      form.append('file', file);

      this.http
        .post<{ data: ImportResult }>(`${this.base}/${ticker.toUpperCase()}`, form)
        .subscribe({
          next: res => {
            this.result.set(res.data);
            this.loading.set(false);
            this.message.add({
              severity: res.data.warnings.length ? 'warn' : 'success',
              summary:  `${res.data.rowsImported} rows imported`,
              detail:   res.data.warnings.length
                ? `${res.data.warnings.length} warning(s)`
                : 'Import completed successfully',
            });
            resolve(true);
          },
          error: err => {
            this.loading.set(false);
            this.message.add({
              severity: 'error',
              summary:  'Import failed',
              detail:   err.error?.message ?? err.message,
            });
            resolve(false);
          },
        });
    });
  }

  reset() {
    this.result.set(null);
  }
}