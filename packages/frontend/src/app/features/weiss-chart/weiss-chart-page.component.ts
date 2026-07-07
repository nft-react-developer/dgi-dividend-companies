import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TabsModule } from 'primeng/tabs';
import { WeissChartComponent } from './components/weiss-chart.component';
import { CompaniesService } from '../companies/companies.service';
import type { Company } from '../companies/company.model';

@Component({
  selector:   'app-weiss-chart-page',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule, TabsModule, WeissChartComponent],
  template: `
    <div class="weiss-chart-wrap">

      <div class="page-header">
        <h2>Weiss Chart</h2>
      </div>

      <div class="search-row">
        <p-autoComplete
          [(ngModel)]="selectedCompany"
          [suggestions]="suggestions()"
          (completeMethod)="search($event)"
          (onSelect)="onSelect($event)"
          optionLabel="name"
          placeholder="Search company by ticker…"
          [dropdown]="true"
          styleClass="company-ac"
          appendTo="body"
        >
          <ng-template #item let-c>
            <div class="ac-item">
              <span class="ac-ticker">{{ c.ticker }}</span>
              <span class="ac-name">{{ c.name }}</span>
            </div>
          </ng-template>
        </p-autoComplete>
      </div>

      <p-tabs value="weiss-chart">
        <p-tablist>
          <p-tab value="weiss-chart">Weiss Chart</p-tab>
        </p-tablist>

        <p-tabpanels>
          <p-tabpanel value="weiss-chart">
            <app-weiss-chart [company]="selectedCompany" />
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

    </div>
  `,
  styles: [`
    .weiss-chart-wrap {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .page-header h2 {
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0 0 0.25rem;
    }

    .search-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    ::ng-deep .company-ac {
      width: 360px;
    }

    .ac-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .ac-ticker {
      font-weight: 600;
      font-size: 0.8rem;
      color: var(--p-primary-color);
      min-width: 48px;
    }

    .ac-name {
      font-size: 0.85rem;
      color: var(--p-text-color);
    }
  `],
})
export class WeissChartPageComponent implements OnInit {
  private companiesSvc = inject(CompaniesService);

  selectedCompany: Company | null = null;
  suggestions = signal<Company[]>([]);

  ngOnInit() {
    if (!this.companiesSvc.items().length) {
      this.companiesSvc.load();
    }
  }

  search(event: { query: string }) {
    const q = event.query.toLowerCase();
    this.suggestions.set(
      this.companiesSvc.items()
        .filter(c =>
          c.ticker.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)
        )
        .slice(0, 10)
    );
  }

  onSelect(event: { value: Company }) {
    this.selectedCompany = event.value;
  }
}

