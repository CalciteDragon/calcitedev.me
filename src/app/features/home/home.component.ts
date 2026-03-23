import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroComponent } from './hero/hero.component';
import { FeatureCardsComponent } from './feature-cards/feature-cards.component';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { bioData } from '../../data/bio.data';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroComponent, FeatureCardsComponent, ScrollRevealDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly bio = bioData;
}
