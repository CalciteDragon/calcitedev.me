import { ComponentFixture, TestBed } from '@angular/core/testing';
import { extrasData } from '../../../../../data/extras.data';
import { ExtraMediaScreenComponent } from './extra-media-screen.component';

describe('ExtraMediaScreenComponent', () => {
  let fixture: ComponentFixture<ExtraMediaScreenComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtraMediaScreenComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtraMediaScreenComponent);
    fixture.componentRef.setInput('topic', extrasData[1]);
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  it('restores the last reported YouTube playback timestamp when reactivated', () => {
    const frame = compiled.querySelector('iframe') as HTMLIFrameElement;
    const postMessage = vi.spyOn(frame.contentWindow as Window, 'postMessage').mockImplementation(() => undefined);

    frame.dispatchEvent(new Event('load'));
    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({ event: 'listening', id: 'extras-keyboard' }),
      'https://www.youtube-nocookie.com',
    );

    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://www.youtube-nocookie.com',
      source: frame.contentWindow,
      data: JSON.stringify({ event: 'infoDelivery', info: { currentTime: 42.8 } }),
    }));

    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    expect(compiled.querySelector('iframe')).toBeNull();

    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();

    expect(compiled.querySelector('iframe')?.getAttribute('src')).toContain('start=42');
  });

  it('starts a YouTube item at its configured initial timestamp', () => {
    fixture.componentRef.setInput('topic', extrasData[2]);
    fixture.componentRef.setInput('mediaIndex', 2);
    fixture.detectChanges();

    const source = compiled.querySelector('iframe')?.getAttribute('src');
    expect(source).toContain('youtube-nocookie.com/embed/XcQ8EndxcuM');
    expect(source).toContain('autoplay=1');
    expect(source).toContain('start=11016');
  });

  it('shows only previous and next arrows as gallery chrome', () => {
    fixture.componentRef.setInput('topic', extrasData[0]);
    fixture.detectChanges();

    expect(compiled.querySelector('.extra-screen__header')).toBeNull();
    expect(compiled.querySelector('.extra-screen__footer')).toBeNull();
    expect(compiled.querySelectorAll('.extra-screen__gallery-controls button')).toHaveLength(2);
    expect(compiled.textContent).not.toContain('Presentation day');
    expect(compiled.textContent).not.toContain('1/3');
  });

  it('emits a popout request from the bottom-right button', () => {
    const popoutRequested = vi.spyOn(fixture.componentInstance.popoutRequested, 'emit');
    const button = compiled.querySelector('.extra-screen__popout') as HTMLButtonElement;

    expect(button).not.toBeNull();
    button.click();

    expect(popoutRequested).toHaveBeenCalledOnce();
  });

  it('clears pointer focus from every screen control without removing keyboard focus', () => {
    // A clicked button stays focused, and the next WASD press flips the browser's
    // :focus-visible heuristic on, ringing a control the player has already moved past.
    fixture.componentRef.setInput('topic', extrasData[0]);
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();

    const selectors = [
      '.extra-screen__gallery-controls button:last-child',
      '.extra-screen__popout',
      '.extra-screen__visit',
    ];

    for (const selector of selectors) {
      const button = compiled.querySelector(selector) as HTMLButtonElement;
      expect(button, selector).not.toBeNull();

      button.focus();
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      expect(document.activeElement, selector).not.toBe(button);

      button.focus();
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(document.activeElement, selector).toBe(button);
      button.blur();
    }
  });

  it('hides the popout button when disabled', () => {
    fixture.componentRef.setInput('showPopoutButton', false);
    fixture.detectChanges();

    expect(compiled.querySelector('.extra-screen__popout')).toBeNull();
    expect(compiled.querySelector('.extra-screen--popout')).not.toBeNull();
  });
});
