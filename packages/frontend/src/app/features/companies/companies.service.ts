import { Injectable, signal, computed } from '@angular/core';
import { HttpClient }                   from '@angular/common/http';
import { MessageService }               from 'primeng/api';
import { environment }                  from '../../../environments/environment';
import type {
  Company, CompanyFilters,
  CreateCompanyPayload, UpdateCompanyPayload,
} from './company.model';

@Injectable({ providedIn: 'root' })
export class CompaniesService {
  private readonly base = `${environment.apiUrl}/companies`;

  // ── State ──────────────────────────────────────────────────────────────────
  items    = signal<Company[]>([]);
  loading  = signal(false);
  error    = signal<string | null>(null);
  filters  = signal<CompanyFilters>({});

  filtered = computed(() => {
    const f     = this.filters();
    let   list  = this.items();

    if (f.search)
      list = list.filter(c =>
        c.name.toLowerCase().includes(f.search!.toLowerCase()) ||
        c.ticker.toLowerCase().includes(f.search!.toLowerCase())
      );

    if (f.sector)
      list = list.filter(c => c.sectorCode === f.sector);

    if (f.isActive !== undefined)
      list = list.filter(c => c.isActive === f.isActive);

    return list;
  });

  constructor(
    private http:    HttpClient,
    private message: MessageService,
  ) {}

  // ── Load ───────────────────────────────────────────────────────────────────
  load() {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<{ data: Company[] }>(this.base).subscribe({
      next:  res => { this.items.set(res.data); this.loading.set(false); },
      error: err => { this.error.set(err.message); this.loading.set(false); },
    });
  }

  // ── Create ─────────────────────────────────────────────────────────────────
  create(payload: CreateCompanyPayload): Promise<boolean> {
    return new Promise(resolve => {
      this.loading.set(true);
      this.http.post<{ data: Company }>(this.base, payload).subscribe({
        next: res => {
          this.items.update(list => [...list, res.data]);
          this.loading.set(false);
          this.message.add({ severity: 'success', summary: 'Company created' });
          resolve(true);
        },
        error: err => {
          this.loading.set(false);
          this.message.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message });
          resolve(false);
        },
      });
    });
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  update(id: number, payload: UpdateCompanyPayload): Promise<boolean> {
    return new Promise(resolve => {
      this.loading.set(true);
      this.http.patch<{ data: Company }>(`${this.base}/${id}`, payload).subscribe({
        next: res => {
          this.items.update(list => list.map(c => c.id === id ? res.data : c));
          this.loading.set(false);
          this.message.add({ severity: 'success', summary: 'Company updated' });
          resolve(true);
        },
        error: err => {
          this.loading.set(false);
          this.message.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message });
          resolve(false);
        },
      });
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  delete(id: number): Promise<boolean> {
    return new Promise(resolve => {
      this.http.delete(`${this.base}/${id}`).subscribe({
        next: () => {
          this.items.update(list => list.filter(c => c.id !== id));
          this.message.add({ severity: 'success', summary: 'Company deleted' });
          resolve(true);
        },
        error: err => {
          this.message.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message });
          resolve(false);
        },
      });
    });
  }

  // ── Upload logo ────────────────────────────────────────────────────────────
  uploadLogo(id: number, file: File): Promise<boolean> {
    return new Promise(resolve => {
      const form = new FormData();
      form.append('logo', file);
      this.http.put(`${this.base}/${id}/logo`, form).subscribe({
        next: () => {
          this.items.update(list =>
            list.map(c => c.id === id ? { ...c, hasLogo: file.type } : c)
          );
          this.message.add({ severity: 'success', summary: 'Logo uploaded' });
          resolve(true);
        },
        error: err => {
          this.message.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message });
          resolve(false);
        },
      });
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  setFilters(f: CompanyFilters) { this.filters.set(f); }
  logoUrl(id: number)           { return `${this.base}/${id}/logo`; }
}