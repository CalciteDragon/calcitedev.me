import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HeroComponent } from './hero/hero.component';
import { FeatureCardsComponent } from './feature-cards/feature-cards.component';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { ProjectsSectionComponent } from './sections/projects-section/projects-section.component';
import { AboutSectionComponent } from './sections/about-section/about-section.component';
import { SkillsSectionComponent } from './sections/skills-section/skills-section.component';
import { ContactSectionComponent } from './sections/contact-section/contact-section.component';
import { ScrollService } from '../../core/services/scroll.service';
import { bioData } from '../../data/bio.data';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroComponent,
    FeatureCardsComponent,
    ScrollRevealDirective,
    ProjectsSectionComponent,
    AboutSectionComponent,
    SkillsSectionComponent,
    ContactSectionComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  readonly bio = bioData;
  private readonly scrollService = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    this.scrollService.initSectionObserver(['home', 'projects', 'about', 'skills', 'contact']);
    if (isPlatformBrowser(this.platformId)) {
      const hash = window.location.hash.replace('#', '');
      if (hash) this.scrollService.scrollToSection(hash);
    }
  }

  ngOnDestroy(): void {
    this.scrollService.destroySectionObserver();
  }
}
