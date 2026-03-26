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
      // NOTE: 'projects' redirect is REMOVED — conflicts with projects/:slug
      { path: 'contact', redirectTo: '' },
      {
        path: 'projects/:slug',
        loadComponent: () =>
          import('./features/projects/project-detail/project-detail.component')
            .then(m => m.ProjectDetailComponent),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
