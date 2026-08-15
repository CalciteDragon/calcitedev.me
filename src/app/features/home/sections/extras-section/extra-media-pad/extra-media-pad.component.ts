import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * One analog slide pad: the housing bolted flush to an island's top edge plus the cap that
 * sinks into it. The platformer owns pad geometry, placement, and press bookkeeping; this
 * component owns only the housing/cap visuals and the lift/press states.
 */
@Component({
  selector: 'app-extra-media-pad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './extra-media-pad.component.html',
  styleUrl: './extra-media-pad.component.scss',
  host: { '[attr.data-accent]': 'accent()' },
})
export class ExtraMediaPadComponent {
  readonly accent = input('cyan');
  readonly glyph = input('');
  readonly active = input(false);
  readonly pressed = input(false);

  readonly pressRequested = output<void>();

  protected requestPress(): void {
    this.pressRequested.emit();
  }
}
