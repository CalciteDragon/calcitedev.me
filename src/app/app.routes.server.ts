import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'projects/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { slug: 'pixel-quest' },
      { slug: 'devboard' },
      { slug: 'neonchat' },
      { slug: 'codecraft-api' },
      { slug: 'starmapper' },
    ],
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
