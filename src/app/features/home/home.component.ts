import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { HeroComponent } from './hero/hero.component';
import { ProjectsSectionComponent } from './sections/projects-section/projects-section.component';
import { AboutSectionComponent } from './sections/about-section/about-section.component';
import { ExtrasSectionComponent } from './sections/extras-section/extras-section.component';
import { ContactSectionComponent } from './sections/contact-section/contact-section.component';
import { ScrollService } from '../../core/services/scroll.service';
import { bioData } from '../../data/bio.data';
import { projectsData } from '../../data/projects.data';
import { extrasData } from '../../data/extras.data';
import { socialLinksData } from '../../data/social-links.data';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroComponent,
    ProjectsSectionComponent,
    AboutSectionComponent,
    ExtrasSectionComponent,
    ContactSectionComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  readonly bio = bioData;
  readonly projects = projectsData;
  readonly extras = extrasData;
  readonly socialLinks = socialLinksData;
  private readonly scrollService = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly titleService = inject(Title);

  ngAfterViewInit(): void {
    this.titleService.setTitle('Tyler Hawthorn — Calcite | Full Stack Developer');
    this.scrollService.initSectionObserver(['home', 'about', 'projects', 'extras', 'contact']);
    if (isPlatformBrowser(this.platformId)) {
      const hash = window.location.hash.replace('#', '');
      if (hash) this.scrollService.scrollToSection(hash);
    }
  }

  ngOnDestroy(): void {
    this.scrollService.destroySectionObserver();
  }
}
