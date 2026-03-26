import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SocialLinksComponent } from '../../shared/components/social-links/social-links.component';
import { socialLinksData } from '../../data/social-links.data';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SocialLinksComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  protected readonly socialLinks = socialLinksData;
}
