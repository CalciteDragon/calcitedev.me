import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ScrollService } from '../../../core/services/scroll.service';
import { CardComponent } from '../../../shared/components/card/card.component';
import { CtaButtonComponent } from '../../../shared/components/cta-button/cta-button.component';
import { GlowColor } from '../../../shared/types/glow-color.type';

interface FeatureCard {
  icon: string;
  iconAlt: string;
  title: string;
  description: string;
  ctaLabel: string;
  sectionId: string;
  glowColor: GlowColor;
}

@Component({
  selector: 'app-feature-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, CtaButtonComponent],
  templateUrl: './feature-cards.component.html',
  styleUrl: './feature-cards.component.scss',
})
export class FeatureCardsComponent {
  private readonly scrollService = inject(ScrollService);

  protected readonly cards: FeatureCard[] = [
    {
      icon: 'assets/pixel-art/icon-about.svg',
      iconAlt: 'Pixel art "About Me" icon',
      title: 'About Me',
      description:
        'Full stack developer who builds fast, well-tested web apps and the occasional game. Learn about my journey and what drives me.',
      ctaLabel: 'Learn More',
      sectionId: 'about',
      glowColor: 'cyan',
    },
    {
      icon: 'assets/pixel-art/icon-projects.svg',
      iconAlt: 'Pixel art "Projects" icon',
      title: 'Latest Projects',
      description:
        "From Angular apps to game experiments — explore the things I've built and the problems they solve.",
      ctaLabel: 'See Projects',
      sectionId: 'projects',
      glowColor: 'blue',
    },
    {
      icon: 'assets/pixel-art/icon-skills.svg',
      iconAlt: 'Pixel art "Skills" icon',
      title: 'My Skills',
      description:
        'TypeScript, Angular, Node.js, PostgreSQL, Docker, and more — a full-stack toolkit built for real-world projects.',
      ctaLabel: 'View Skills',
      sectionId: 'skills',
      glowColor: 'purple',
    },
  ];

  protected scrollToSection(id: string): void {
    this.scrollService.scrollToSection(id);
  }
}
