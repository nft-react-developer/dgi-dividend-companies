import { Injectable, signal, computed } from '@angular/core';
import { HttpClient }                   from '@angular/common/http';
import { MessageService }               from 'primeng/api';
import { environment }                  from '../../../environments/environment';
import type {
  FieldMapper, MapperFilters,
  CreateMapperPayload, UpdateMapperPayload,
} from './mapper.model';

@Injectable()
export class MapperService {
  private readonly base = `${environment.apiUrl}/mapper`;

  items   = signal<FieldMapper[]>([]);
  loading = signal(false);
  filters = signal<MapperFilters>({});

  filtered = computed(() => {
    const f    = this.filters();
    let   list = this.items();

    if (f.search)
      list = list.filter(m =>
        m.rawLabel.toLowerCase().includes(f.search!.toLowerCase()) ||
        m.canonicalField.toLowerCase().includes(f.search!.toLowerCase()) ||
        (m.companyTicker ?? '').toLowerCase().includes(f.search!.toLowerCase())
      );

    if (f.companyId !== undefined)
      list = list.filter(m => m.companyId === f.companyId);

    if (f.statementType)
      list = list.filter(m => m.statementType === f.statementType);

    if (f.isActive !== undefined)
      list = list.filter(m => m.isActive === f.isActive);

    return list;
  });

  constructor(
    private http:    HttpClient,
    private message: MessageService,
  ) {}

  load() {
    this.loading.set(true);
    this.http.get<{ data: FieldMapper[] }>(this.base).subscribe({
      next:  res => { this.items.set(res.data); this.loading.set(false); },
      error: err => { this.loading.set(false); this.message.add({ severity: 'error', summary: 'Error loading mappers', detail: err.message }); },
    });
  }

  create(payload: CreateMapperPayload): Promise<boolean> {
    return new Promise(resolve => {
      this.loading.set(true);
      this.http.post<{ data: FieldMapper }>(this.base, payload).subscribe({
        next: res => {
          this.items.update(list => [...list, res.data]);
          this.loading.set(false);
          this.message.add({ severity: 'success', summary: 'Mapper created' });
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

  update(id: number, payload: UpdateMapperPayload): Promise<boolean> {
    return new Promise(resolve => {
      this.loading.set(true);
      this.http.patch<{ data: FieldMapper }>(`${this.base}/${id}`, payload).subscribe({
        next: res => {
          this.items.update(list => list.map(m => m.id === id ? res.data : m));
          this.loading.set(false);
          this.message.add({ severity: 'success', summary: 'Mapper updated' });
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

  delete(id: number): Promise<boolean> {
    return new Promise(resolve => {
      this.http.delete(`${this.base}/${id}`).subscribe({
        next: () => {
          this.items.update(list => list.filter(m => m.id !== id));
          this.message.add({ severity: 'success', summary: 'Mapper deleted' });
          resolve(true);
        },
        error: err => {
          this.message.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? err.message });
          resolve(false);
        },
      });
    });
  }

  setFilters(f: MapperFilters) { this.filters.set(f); }
}
