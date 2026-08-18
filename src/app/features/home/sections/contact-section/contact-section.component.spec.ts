import { TestBed } from '@angular/core/testing';
import { SocialLink } from '../../../../models/social-link.model';
import { ContactSectionComponent } from './contact-section.component';

const socialLinks: readonly SocialLink[] = [
  { platform: 'github', url: 'https://github.com/example', label: 'GitHub', handle: '@example' },
];

describe('ContactSectionComponent', () => {
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ContactSectionComponent] });
    const fixture = TestBed.createComponent(ContactSectionComponent);
    fixture.componentRef.setInput('email', 'tyler@example.com');
    fixture.componentRef.setInput('socialLinks', socialLinks);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('leads the handle list with a mailto row for the email', () => {
    const anchors = element.querySelectorAll('a');
    expect(anchors).toHaveLength(2);
    expect(anchors[0].getAttribute('href')).toBe('mailto:tyler@example.com');
    expect(anchors[0].querySelector('.social-links__handle')?.textContent?.trim())
      .toBe('tyler@example.com');
    expect(anchors[1].getAttribute('href')).toBe('https://github.com/example');
  });

  it('reveals the list on scroll', () => {
    expect(element.querySelector('.contact-section__content.scroll-reveal')).not.toBeNull();
  });
});
