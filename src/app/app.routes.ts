import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then(module => module.HomeComponent),
      },
      // Section paths redirect to home — all portfolio content is on the single page.
      { path: 'about', redirectTo: '' },
      { path: 'projects', redirectTo: '' },
      { path: 'contact', redirectTo: '' },
      { path: '**', redirectTo: '' },
    ],
  },
];
