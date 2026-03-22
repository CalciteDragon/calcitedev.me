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
    cyan: 'var(--glow-cyan)',
    blue: 'var(--glow-blue)',
    purple: 'var(--glow-purple)',
    pink: 'var(--glow-pink)',
    gold: 'var(--glow-gold)',
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
