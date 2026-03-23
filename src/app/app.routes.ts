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
          import('./features/home/home.component').then(m => m.HomeComponent),
      },
      // Section paths redirect to home — all content is on the single page
      { path: 'about', redirectTo: '' },
      { path: 'projects', redirectTo: '' },
      { path: 'contact', redirectTo: '' },
      // Future detail page — scaffolded in Phase 6
      // { path: 'projects/:slug', loadComponent: () => import('./features/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent) },
      { path: '**', redirectTo: '' },
    ],
  },
];
