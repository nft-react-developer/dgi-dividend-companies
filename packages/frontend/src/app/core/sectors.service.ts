import { Injectable, signal } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { environment }        from '../../environments/environment';

export interface Sector {
  id:   number;
  code: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class SectorsService {
  items   = signal<Sector[]>([]);
  loading = signal(false);
  private loaded = false;

  constructor(private http: HttpClient) {}

  load() {
    if (this.loaded) return;
    this.loading.set(true);
    this.http.get<{ data: Sector[] }>(`${environment.apiUrl}/sectors`).subscribe({
      next: res => {
        this.items.set(res.data);
        this.loading.set(false);
        this.loaded = true;
      },
      error: () => this.loading.set(false),
    });
  }
}