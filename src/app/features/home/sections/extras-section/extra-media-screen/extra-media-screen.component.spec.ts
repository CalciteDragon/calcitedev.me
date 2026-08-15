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

  it('reports when the connected YouTube player starts and stops playing', () => {
    const playbackChanged = vi.spyOn(fixture.componentInstance.videoPlaybackChanged, 'emit');
    const frame = compiled.querySelector('iframe') as HTMLIFrameElement;
    frame.dispatchEvent(new Event('load'));

    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://www.youtube-nocookie.com',
      source: frame.contentWindow,
      data: JSON.stringify({ event: 'infoDelivery', info: { playerState: 1 } }),
    }));
    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://www.youtube-nocookie.com',
      source: frame.contentWindow,
      data: JSON.stringify({ event: 'infoDelivery', info: { playerState: 2 } }),
    }));

    expect(playbackChanged).toHaveBeenNthCalledWith(1, true);
    expect(playbackChanged).toHaveBeenNthCalledWith(2, false);
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

  it('clears pointer focus from carousel arrows without removing keyboard focus', () => {
    fixture.componentRef.setInput('topic', extrasData[0]);
    fixture.detectChanges();
    const button = compiled.querySelector(
      '.extra-screen__gallery-controls button:last-child',
    ) as HTMLButtonElement;

    button.focus();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(document.activeElement).not.toBe(button);

    button.focus();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.activeElement).toBe(button);
  });

  it('hides the popout button when disabled', () => {
    fixture.componentRef.setInput('showPopoutButton', false);
    fixture.detectChanges();

    expect(compiled.querySelector('.extra-screen__popout')).toBeNull();
    expect(compiled.querySelector('.extra-screen--popout')).not.toBeNull();
  });
});
