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

  it('shows only previous and next arrows as gallery chrome', () => {
    fixture.componentRef.setInput('topic', extrasData[0]);
    fixture.detectChanges();

    expect(compiled.querySelector('.extra-screen__header')).toBeNull();
    expect(compiled.querySelector('.extra-screen__footer')).toBeNull();
    expect(compiled.querySelectorAll('.extra-screen__gallery-controls button')).toHaveLength(2);
    expect(compiled.textContent).not.toContain('Presentation day');
    expect(compiled.textContent).not.toContain('1/3');
  });
});
