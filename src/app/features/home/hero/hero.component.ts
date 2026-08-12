import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { Bio } from '../../../models/bio.model';

@Component({
  selector: 'app-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent {
  readonly bio = input.required<Bio>();
}
