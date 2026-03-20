# Coding Conventions

## Angular & TypeScript

### General

- **Strict mode** enabled in `tsconfig.json` (`strict: true`)
- **Standalone components** exclusively — no NgModules
- **Signals** for component state; RxJS reserved for async streams
- **OnPush** change detection on all components
- Follow the [Angular Style Guide](https://angular.dev/style-guide) unless overridden here

### Naming

| Thing             | Convention            | Example                         |
| ----------------- | --------------------- | ------------------------------- |
| Components        | kebab-case files      | `project-card.component.ts`     |
| Component class   | PascalCase            | `ProjectCardComponent`          |
| Services          | kebab-case files      | `theme.service.ts`              |
| Service class     | PascalCase            | `ThemeService`                  |
| Models/Interfaces | kebab-case files      | `project.model.ts`              |
| Interface         | PascalCase, no `I`    | `Project` (not `IProject`)      |
| Directives        | kebab-case files      | `scroll-reveal.directive.ts`    |
| Directive selector| camelCase, app prefix | `appScrollReveal`               |
| Component selector| kebab-case, app prefix| `app-project-card`              |
| Constants         | camelCase             | `projectsData`                  |
| Enums             | PascalCase            | `ProjectCategory`               |
| SCSS variables    | kebab-case            | `$color-accent`                 |
| CSS custom props  | kebab-case            | `--accent-cyan`                 |

### File Organization

Each component gets its own folder with co-located files:

```
project-card/
├── project-card.component.ts       # Component class + metadata
├── project-card.component.html     # Template
├── project-card.component.scss     # Styles (scoped)
└── project-card.component.spec.ts  # Tests (when needed)
```

Inline templates/styles are acceptable for very small components (< 15 lines of template).

### Component Patterns

#### Presentational (Shared) Components

```typescript
@Component({
  selector: 'app-project-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss'
})
export class ProjectCardComponent {
  project = input.required<Project>();   // signal input
  clicked = output<string>();            // output event
}
```

- All inputs via `input()` / `input.required()` (signal-based)
- All outputs via `output()`
- No service injection
- No side effects

#### Smart (Feature) Components

```typescript
@Component({
  selector: 'app-projects',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectCardComponent, SectionHeaderComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent {
  projects = signal(projectsData);
  filter = signal<string | null>(null);

  filtered = computed(() => {
    const f = this.filter();
    return f ? this.projects().filter(p => p.tags.includes(f)) : this.projects();
  });
}
```

- Owns state and data
- Passes data down to presentational children
- Can inject services

#### Canvas Components

```typescript
@Component({ ... })
export class BackgroundSceneComponent implements AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize canvas rendering loop
    }
  }
}
```

- Guard all browser APIs behind `isPlatformBrowser()` for SSR compatibility
- Clean up animation frames in `ngOnDestroy`
- Keep rendering logic in a separate utility/class, not inline in the component

### Services

- Use `providedIn: 'root'` for singleton services
- Use `inject()` function instead of constructor injection
- Keep services focused — one responsibility each

## SCSS

### Structure

- Global partials in `src/styles/` — imported via `styles.scss`
- Component styles are scoped (Angular default `ViewEncapsulation.Emulated`)
- Use CSS custom properties (`var(--accent-cyan)`) for theming — enables future dark/light toggle
- Use SCSS variables and mixins for compile-time values (breakpoints, spacing scale)

### Design Tokens via CSS Custom Properties

All colors and glow presets defined as CSS custom properties on `:root` (see design.md). Components reference these rather than hard-coding hex values.

### Glow Presets

```scss
@mixin neon-glow($color, $intensity: 0.3) {
  box-shadow: 0 0 15px rgba($color, $intensity),
              inset 0 0 15px rgba($color, calc($intensity * 0.2));
  border: 1px solid rgba($color, $intensity);
}
```

### Responsive

```scss
// Mobile-first responsive
.grid {
  display: grid;
  grid-template-columns: 1fr;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

- **No magic numbers** — use variables for colors, spacing, breakpoints
- **BEM-lite naming** where class names are needed: `.card`, `.card__title`, `.card--cyan`
- **Avoid deep nesting** — max 3 levels
- Prefer CSS Grid and Flexbox

## Code Quality

- No `any` types — define proper interfaces
- No unused imports or variables
- Prefer `const` over `let`; never use `var`
- Use early returns to reduce nesting
- Keep functions small and focused (< 30 lines as a guideline)
- Template expressions should be simple — move logic to computed signals

## Git

- Conventional commits: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`
- Commit messages: imperative mood, lowercase, no period (`feat: add project card component`)
- Feature branches off `main`: `feat/project-cards`, `fix/navbar-mobile`
