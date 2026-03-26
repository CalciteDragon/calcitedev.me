import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SocialLink } from '../../../../models/social-link.model';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { SocialLinksComponent } from '../../../../shared/components/social-links/social-links.component';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-contact-section',
  standalone: true,
  imports: [SectionHeaderComponent, SocialLinksComponent, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-section.component.html',
  styleUrl: './contact-section.component.scss',
})
export class ContactSectionComponent {
  readonly email = input.required<string>();
  readonly socialLinks = input.required<readonly SocialLink[]>();
}
