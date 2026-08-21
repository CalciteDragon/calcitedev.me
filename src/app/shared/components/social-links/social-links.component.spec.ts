import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SocialLink } from '../../../models/social-link.model';
import { SocialLinksComponent } from './social-links.component';

const links: readonly SocialLink[] = [
  { platform: 'email', url: 'mailto:me@example.com', label: 'Email', handle: 'me@example.com' },
  { platform: 'github', url: 'https://github.com/example', label: 'GitHub', handle: '@example' },
  { platform: 'unknown', url: 'https://example.com', label: 'Elsewhere', handle: '@elsewhere' },
];

function render(layout?: 'row' | 'list'): HTMLElement {
  TestBed.configureTestingModule({ imports: [SocialLinksComponent] });
  const fixture = TestBed.createComponent(SocialLinksComponent);
  const ref: ComponentRef<SocialLinksComponent> = fixture.componentRef;
  ref.setInput('links', links);
  if (layout) ref.setInput('layout', layout);
  fixture.detectChanges();
  return fixture.nativeElement;
}

describe('SocialLinksComponent', () => {
  it('defaults to an icon-only row labelled for screen readers', () => {
    const element = render();
    expect(element.querySelector('.social-links--list')).toBeNull();
    expect(element.querySelectorAll('.social-links__handle')).toHaveLength(0);
    expect(element.querySelectorAll('a')[1].getAttribute('aria-label')).toBe('GitHub');
  });

  it('renders a handle beside each icon in list layout', () => {
    const element = render('list');
    const handles = Array.from(element.querySelectorAll('.social-links__handle'), el =>
      el.textContent?.trim(),
    );
    expect(handles).toEqual(['me@example.com', '@example', '@elsewhere']);
    expect(
      Array.from(element.querySelectorAll('.social-links__platform'), el => el.textContent?.trim()),
    ).toEqual(['Email', 'GitHub', 'Elsewhere']);
  });

  it('drops the redundant aria-label once the name is visible', () => {
    const element = render('list');
    expect(element.querySelectorAll('a')[1].getAttribute('aria-label')).toBeNull();
  });

  it('keeps mailto links in the current tab and opens the rest in a new one', () => {
    const anchors = render('list').querySelectorAll('a');
    expect(anchors[0].getAttribute('target')).toBeNull();
    expect(anchors[0].getAttribute('rel')).toBeNull();
    expect(anchors[1].getAttribute('target')).toBe('_blank');
    expect(anchors[1].getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('falls back to a text label for a platform with no registered icon', () => {
    const element = render();
    const anchors = element.querySelectorAll('a');
    expect(anchors[2].querySelector('svg')).toBeNull();
    expect(anchors[2].querySelector('.social-links__label')?.textContent?.trim()).toBe('Elsewhere');
  });
});
