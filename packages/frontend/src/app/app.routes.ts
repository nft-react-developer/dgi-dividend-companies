import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path:       '',
    redirectTo: 'dashboard',
    pathMatch:  'full',
  },
  {
    path:          'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
                           .then(m => m.DashboardComponent),
  },
  {
    path:          'companies',
    loadComponent: () => import('./features/companies/companies.component')
                           .then(m => m.CompaniesComponent),
  },
  {
    path:          'importer',
    loadComponent: () => import('./features/importer/importer.component')
                           .then(m => m.ImporterComponent),
  },
  {
    path:       '**',
    redirectTo: 'dashboard',
  },
];