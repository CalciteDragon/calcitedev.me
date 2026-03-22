import { computed, Directive, input, signal } from '@angular/core';

@Directive({
  selector: '[appGlow]',
  standalone: true,
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '[style.box-shadow]': 'currentGlow()',
    '[style.transition]': '"box-shadow 300ms ease-out"',
  },
})
export class GlowDirective {
  readonly appGlow = input<string>('cyan');

  private readonly isHovered = signal(false);

  private readonly glowMap: Record<string, string> = {
    cyan: '0 0 20px rgba(34, 211, 238, 0.5), 0 0 40px rgba(34, 211, 238, 0.15)',
    blue: '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.15)',
    purple: '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.15)',
    pink: '0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(236, 72, 153, 0.15)',
    gold: '0 0 20px rgba(245, 158, 11, 0.5), 0 0 40px rgba(245, 158, 11, 0.15)',
  };

  protected readonly currentGlow = computed(() => {
    if (!this.isHovered()) return 'none';
    return this.glowMap[this.appGlow()] ?? this.glowMap['cyan'];
  });

  protected onMouseEnter(): void {
    this.isHovered.set(true);
  }

  protected onMouseLeave(): void {
    this.isHovered.set(false);
  }
}
