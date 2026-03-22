import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { TableModule }         from 'primeng/table';
import { ButtonModule }        from 'primeng/button';
import { InputTextModule }     from 'primeng/inputtext';
import { TagModule }           from 'primeng/tag';
import { Menu, MenuModule }          from 'primeng/menu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AvatarModule }        from 'primeng/avatar';
import { SkeletonModule }      from 'primeng/skeleton';
import { TooltipModule }       from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CompaniesService }    from './companies.service';
import { CompanyFormComponent } from './company-form.component';
import type { Company }        from './company.model';

@Component({
  selector:   'app-companies',
  standalone: true,
  imports: [
    TableModule, ButtonModule, InputTextModule, TagModule,
    MenuModule, ConfirmDialogModule, AvatarModule, SkeletonModule,
    TooltipModule, CompanyFormComponent,
  ],
  providers: [ConfirmationService,CompaniesService, MessageService],
  template: `
    <p-confirmDialog />

    <!-- Header -->
    <div class="page-header">
      <div>
        <h2>Companies</h2>
        <span class="subtitle">{{ svc.filtered().length }} companies</span>
      </div>
      <p-button label="New company" icon="pi pi-plus" (onClick)="openForm(null)" />
    </div>

    <!-- Filters -->
    <div class="filters">
      <input
        pInputText
        placeholder="Search by name or ticker..."
        class="search-input"
        (input)="onSearch($event)" />
    </div>

    <!-- Table -->
    <p-table
      [value]="svc.filtered()"
      [loading]="svc.loading()"
      [rowHover]="true"
      [paginator]="true"
      [rows]="20"
      [rowsPerPageOptions]="[10, 20, 50]"
      styleClass="p-datatable-sm">

      <ng-template pTemplate="header">
        <tr>
          <th style="width:56px">Logo</th>
          <th pSortableColumn="ticker">Ticker <p-sortIcon field="ticker" /></th>
          <th pSortableColumn="name">Name <p-sortIcon field="name" /></th>
          <th>Sector</th>
          <th>Country</th>
          <th>Currency</th>
          <th>Exchange</th>
          <th pSortableColumn="isActive">Status <p-sortIcon field="isActive" /></th>
          <th style="width:56px"></th>
        </tr>
      </ng-template>

      <ng-template pTemplate="body" let-company>
        <tr>
          <!-- Logo -->
          <td>
            @if (company.hasLogo) {
              <p-avatar
                [image]="svc.logoUrl(company.id)"
                shape="circle"
                size="normal" />
            } @else {
              <p-avatar
                [label]="company.ticker.charAt(0)"
                shape="circle"
                size="normal" />
            }
          </td>

          <td><strong>{{ company.ticker }}</strong></td>
          <td>{{ company.name }}</td>

          <td>
            <p-tag
              [value]="company.sectorName ?? company.sectorCode ?? '—'"
              severity="secondary" />
          </td>

          <td>{{ company.countryIso }}</td>
          <td>{{ company.currency }}</td>
          <td>{{ company.exchange ?? '—' }}</td>

          <td>
            <p-tag
              [value]="company.isActive ? 'Active' : 'Inactive'"
              [severity]="company.isActive ? 'success' : 'danger'" />
          </td>

          <!-- Actions -->
         <td>
  <p-button
    icon="pi pi-ellipsis-v"
    [text]="true"
    severity="secondary"
    size="small"
    (onClick)="menu.toggle($event); setMenuCompany(company)" />
</td>
        </tr>
      </ng-template>

      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="9" class="empty-state">
            <i class="pi pi-building"></i>
            <span>No companies found</span>
          </td>
        </tr>
      </ng-template>

    </p-table>

    <!-- Context menu -->
    <p-menu #menu [model]="menuItems()" [popup]="true" />

    <!-- Form dialog -->
    @if (formVisible()) {
      <app-company-form
        [visible]="formVisible()"
        [company]="selectedCompany()"
        [saving]="svc.loading()"
        (closed)="closeForm()"
        (submitted)="onFormSubmit($event)"
        (logoSelected)="onLogoSelected($event)" />
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
      margin-bottom: 1rem;
    }

    .search-input { width: 320px; }

    .empty-state {
      text-align: center;
      padding:    3rem !important;
      color:      var(--p-text-muted-color);
      i    { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
      span { font-size: 0.9rem; }
    }
  `],
})
export class CompaniesComponent implements OnInit {
  svc         = inject(CompaniesService);
  private confirm = inject(ConfirmationService);

  formVisible     = signal(false);
  selectedCompany = signal<Company | null>(null);
  menuItems       = signal<any[]>([]);
  private menuCompany: Company | null = null;

  ngOnInit() { this.svc.load(); }

  @ViewChild('menu') menu!: Menu;

  // ── Filters ────────────────────────────────────────────────────────────────
  onSearch(event: Event) {
    const search = (event.target as HTMLInputElement).value;
    this.svc.setFilters({ ...this.svc.filters(), search });
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  openForm(company: Company | null) {
    this.selectedCompany.set(company);
    this.formVisible.set(true);
  }

  closeForm() {
    this.formVisible.set(false);
    this.selectedCompany.set(null);
  }

  async onFormSubmit(payload: any) {
    const company = this.selectedCompany();
    const ok = company
      ? await this.svc.update(company.id, payload)
      : await this.svc.create(payload);
    if (ok) this.closeForm();
  }

  async onLogoSelected(file: File) {
    const company = this.selectedCompany();
    if (company) await this.svc.uploadLogo(company.id, file);
  }

  // ── Menu ───────────────────────────────────────────────────────────────────
  setMenuCompany(company: Company) {
  this.menuCompany = company;
  this.menuItems.set([
    {
      label:   'Edit',
      icon:    'pi pi-pencil',
      command: () => this.openForm(this.menuCompany!),
    },
    {
      label:   'Delete',
      icon:    'pi pi-trash',
      command: () => this.confirmDelete(this.menuCompany!),
    },
  ]);
}

  confirmDelete(company: Company) {
    this.confirm.confirm({
      message: `Delete <strong>${company.name}</strong>? This cannot be undone.`,
      header:  'Confirm delete',
      icon:    'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept:  () => this.svc.delete(company.id),
    });
  }
}