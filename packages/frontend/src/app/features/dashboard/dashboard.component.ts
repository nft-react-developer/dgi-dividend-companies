import { Component } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { FinancialDataComponent } from '../financial-data/financial-data.component';

@Component({
  selector:   'app-dashboard',
  standalone: true,
  imports: [TabsModule, FinancialDataComponent],
  template: `
    <div class="dashboard-wrap">

      <div class="page-header">
        <h2>Dashboard</h2>
      </div>

      <p-tabs value="financial-data">
        <p-tablist>
          <p-tab value="financial-data">Financial Data</p-tab>
        </p-tablist>

        <p-tabpanels>
          <p-tabpanel value="financial-data">
            <app-financial-data />
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

    </div>
  `,
  styles: [`
    .dashboard-wrap {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .page-header h2 {
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0 0 0.25rem;
    }
  `],
})
export class DashboardComponent {}
