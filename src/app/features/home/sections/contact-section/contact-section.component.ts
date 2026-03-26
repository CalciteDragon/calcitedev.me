import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SocialLink } from '../../../../models/social-link.model';

@Component({
  selector: 'app-contact-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-section.component.html',
  styleUrl: './contact-section.component.scss',
})
export class ContactSectionComponent {
  readonly email = input.required<string>();
  readonly socialLinks = input.required<readonly SocialLink[]>();
}
