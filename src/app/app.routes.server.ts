import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'projects/pixel-quest', renderMode: RenderMode.Prerender },
  { path: 'projects/devboard', renderMode: RenderMode.Prerender },
  { path: 'projects/neonchat', renderMode: RenderMode.Prerender },
  { path: 'projects/codecraft-api', renderMode: RenderMode.Prerender },
  { path: 'projects/starmapper', renderMode: RenderMode.Prerender },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
