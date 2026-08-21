import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExtraMediaPadComponent } from './extra-media-pad.component';

describe('ExtraMediaPadComponent', () => {
  let fixture: ComponentFixture<ExtraMediaPadComponent>;
  let host: HTMLElement;
  let cap: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtraMediaPadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtraMediaPadComponent);
    fixture.componentRef.setInput('glyph', '›');
    fixture.componentRef.setInput('accent', 'gold');
    fixture.detectChanges();
    host = fixture.nativeElement;
    cap = host.querySelector('.extra-pad')!;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('renders its glyph on a button held out of the tab order and accessibility tree', () => {
    // The explorer drives the pads; they duplicate the on-screen gallery arrows for pointers only.
    expect(cap.type).toBe('button');
    expect(cap.tabIndex).toBe(-1);
    expect(cap.getAttribute('aria-hidden')).toBe('true');
    expect(cap.textContent?.trim()).toBe('›');
  });

  it('reflects the accent onto the host so --pad-accent cascades down to the cap', () => {
    expect(host.getAttribute('data-accent')).toBe('gold');

    fixture.componentRef.setInput('accent', 'pink');
    fixture.detectChanges();
    expect(host.getAttribute('data-accent')).toBe('pink');
  });

  it('drives the lift and press states from its inputs', () => {
    expect(cap.classList).not.toContain('extra-pad--active');
    expect(cap.classList).not.toContain('extra-pad--pressed');

    fixture.componentRef.setInput('active', true);
    fixture.componentRef.setInput('pressed', true);
    fixture.detectChanges();
    expect(cap.classList).toContain('extra-pad--active');
    expect(cap.classList).toContain('extra-pad--pressed');

    // Releasing keeps the island lifted but springs the cap back.
    fixture.componentRef.setInput('pressed', false);
    fixture.detectChanges();
    expect(cap.classList).toContain('extra-pad--active');
    expect(cap.classList).not.toContain('extra-pad--pressed');
  });

  it('clears pointer focus from the cap so a later WASD press does not ring it', () => {
    cap.focus();
    cap.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(document.activeElement).not.toBe(cap);

    // Keyboard activation reports detail 0 and must keep its focus.
    cap.focus();
    cap.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.activeElement).toBe(cap);
    cap.blur();
  });

  it('emits pressRequested on every click so the platformer owns the slide change', () => {
    let presses = 0;
    fixture.componentInstance.pressRequested.subscribe(() => { presses += 1; });

    cap.click();
    cap.click();
    fixture.detectChanges();

    expect(presses).toBe(2);
  });
});
