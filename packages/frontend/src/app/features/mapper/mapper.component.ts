import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { TableModule }         from 'primeng/table';
import { ButtonModule }        from 'primeng/button';
import { InputTextModule }     from 'primeng/inputtext';
import { TagModule }           from 'primeng/tag';
import { SelectModule }        from 'primeng/select';
import { Menu, MenuModule }    from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule }       from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MapperService }       from './mapper.service';
import { MapperFormComponent } from './mapper-form.component';
import { CompaniesService }    from '../companies/companies.service';
import type { FieldMapper }    from './mapper.model';
import { STATEMENT_TYPES }     from './mapper.model';

@Component({
  selector:   'app-mapper',
  standalone: true,
  imports: [
    TableModule, ButtonModule, InputTextModule, TagModule,
    SelectModule, MenuModule, ConfirmDialogModule, TooltipModule,
    MapperFormComponent,
  ],
  providers: [ConfirmationService, MapperService, MessageService],
  template: `
    <p-confirmDialog />

    <!-- Header -->
    <div class="page-header">
      <div>
        <h2>Field Mapper</h2>
        <span class="subtitle">{{ svc.filtered().length }} rules</span>
      </div>
      <p-button label="New rule" icon="pi pi-plus" (onClick)="openForm(null)" />
    </div>

    <!-- Filters -->
    <div class="filters">
      <input
        pInputText
        placeholder="Search by label, field or ticker..."
        class="search-input"
        (input)="onSearch($event)" />

      <p-select
        [options]="statementTypes"
        optionLabel="label"
        optionValue="value"
        placeholder="All statements"
        [showClear]="true"
        (onChange)="onStatementFilter($event.value)"
        class="filter-select" />

      <p-select
        [options]="companiesSvc.items()"
        optionLabel="ticker"
        optionValue="id"
        placeholder="All companies"
        [showClear]="true"
        [filter]="true"
        filterPlaceholder="Search..."
        (onChange)="onCompanyFilter($event.value)"
        class="filter-select" />
    </div>

    <!-- Table -->
    <p-table
      [value]="svc.filtered()"
      [loading]="svc.loading()"
      [rowHover]="true"
      [paginator]="true"
      [rows]="25"
      [rowsPerPageOptions]="[25, 50, 100]"
      styleClass="p-datatable-sm">

      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="companyTicker">Ticker <p-sortIcon field="companyTicker" /></th>
          <th pSortableColumn="statementType">Statement <p-sortIcon field="statementType" /></th>
          <th pSortableColumn="rawLabel">Raw label <p-sortIcon field="rawLabel" /></th>
          <th pSortableColumn="canonicalField">Canonical field <p-sortIcon field="canonicalField" /></th>
          <th>Target</th>
          <th pSortableColumn="transform">Transform <p-sortIcon field="transform" /></th>
          <th pSortableColumn="priority">Priority <p-sortIcon field="priority" /></th>
          <th pSortableColumn="isActive">Status <p-sortIcon field="isActive" /></th>
          <th style="width:56px"></th>
        </tr>
      </ng-template>

      <ng-template pTemplate="body" let-m>
        <tr>
          <td>
            @if (m.companyTicker) {
              <strong>{{ m.companyTicker }}</strong>
            } @else {
              <span class="muted">Global</span>
            }
          </td>

          <td>
            <p-tag [value]="statementLabel(m.statementType)" severity="secondary" />
          </td>

          <td>{{ m.rawLabel }}</td>
          <td><code>{{ m.canonicalField }}</code></td>

          <td>
            <span class="target">{{ m.targetTable }}.{{ m.targetColumn }}</span>
          </td>

          <td>
            @if (m.transform !== 'none') {
              <p-tag [value]="m.transform" severity="info" />
            } @else {
              <span class="muted">—</span>
            }
          </td>

          <td>{{ m.priority }}</td>

          <td>
            <p-tag
              [value]="m.isActive ? 'Active' : 'Inactive'"
              [severity]="m.isActive ? 'success' : 'danger'" />
          </td>

          <td>
            <p-button
              icon="pi pi-ellipsis-v"
              [text]="true"
              severity="secondary"
              size="small"
              (onClick)="menu.toggle($event); setMenuMapper(m)" />
          </td>
        </tr>
      </ng-template>

      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="9" class="empty-state">
            <i class="pi pi-sliders-h"></i>
            <span>No mapper rules found</span>
          </td>
        </tr>
      </ng-template>

    </p-table>

    <!-- Context menu -->
    <p-menu #menu [model]="menuItems()" [popup]="true" />

    <!-- Form dialog -->
    @if (formVisible()) {
      <app-mapper-form
        [visible]="formVisible()"
        [mapper]="selectedMapper()"
        [saving]="svc.loading()"
        (closed)="closeForm()"
        (submitted)="onFormSubmit($event)" />
    }
  `,
  styles: [`
    .page-header {
      display:         flex;
      justify-content: space-between;
      align-items:     center;
      margin-bottom:   1.25rem;

      h2       { font-size: 1.3rem; font-weight: 600; margin: 0; }
      .subtitle { font-size: 0.8rem; color: var(--p-text-muted-color); }
    }

    .filters {
      display:       flex;
      gap:           0.75rem;
      margin-bottom: 1rem;
      flex-wrap:     wrap;
    }

    .search-input  { width: 280px; }
    .filter-select { width: 200px; }

    code {
      font-family:      monospace;
      font-size:        0.82rem;
      background:       var(--p-surface-100);
      padding:          0.1rem 0.35rem;
      border-radius:    4px;
    }

    .target {
      font-family: monospace;
      font-size:   0.82rem;
      color:       var(--p-text-muted-color);
    }

    .muted { color: var(--p-text-muted-color); font-size: 0.85rem; }

    .empty-state {
      text-align: center;
      padding:    3rem !important;
      color:      var(--p-text-muted-color);
      i    { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
      span { font-size: 0.9rem; }
    }
  `],
})
export class MapperComponent implements OnInit {
  svc          = inject(MapperService);
  companiesSvc = inject(CompaniesService);
  private confirm = inject(ConfirmationService);

  formVisible   = signal(false);
  selectedMapper = signal<FieldMapper | null>(null);
  menuItems     = signal<any[]>([]);
  private menuMapper: FieldMapper | null = null;

  statementTypes = STATEMENT_TYPES;

  @ViewChild('menu') menu!: Menu;

  ngOnInit() {
    this.svc.load();
    this.companiesSvc.load();
  }

  statementLabel(value: string): string {
    return STATEMENT_TYPES.find(s => s.value === value)?.label ?? value;
  }

  onSearch(event: Event) {
    const search = (event.target as HTMLInputElement).value;
    this.svc.setFilters({ ...this.svc.filters(), search });
  }

  onStatementFilter(value: string | null) {
    this.svc.setFilters({ ...this.svc.filters(), statementType: value as any ?? undefined });
  }

  onCompanyFilter(value: number | null) {
    this.svc.setFilters({ ...this.svc.filters(), companyId: value ?? undefined });
  }

  openForm(mapper: FieldMapper | null) {
    this.selectedMapper.set(mapper);
    this.formVisible.set(true);
  }

  closeForm() {
    this.formVisible.set(false);
    this.selectedMapper.set(null);
  }

  async onFormSubmit(payload: any) {
    const mapper = this.selectedMapper();
    const ok = mapper
      ? await this.svc.update(mapper.id, payload)
      : await this.svc.create(payload);
    if (ok) this.closeForm();
  }

  setMenuMapper(mapper: FieldMapper) {
    this.menuMapper = mapper;
    this.menuItems.set([
      {
        label:   'Edit',
        icon:    'pi pi-pencil',
        command: () => this.openForm(this.menuMapper!),
      },
      {
        label:   'Delete',
        icon:    'pi pi-trash',
        command: () => this.confirmDelete(this.menuMapper!),
      },
    ]);
  }

  confirmDelete(mapper: FieldMapper) {
    this.confirm.confirm({
      message: `Delete rule <strong>${mapper.rawLabel}</strong>? This cannot be undone.`,
      header:  'Confirm delete',
      icon:    'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept:  () => this.svc.delete(mapper.id),
    });
  }
}
