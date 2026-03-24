import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ScrollService } from './scroll.service';

describe('ScrollService', () => {
  let service: ScrollService;
  let doc: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScrollService],
    });
    service = TestBed.inject(ScrollService);
    doc = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    service.destroySectionObserver();
  });

  it('activeSection defaults to "home"', () => {
    expect(service.activeSection()).toBe('home');
  });

  it('scrollToSection calls getElementById and scrollIntoView in browser', () => {
    const mockElement = { scrollIntoView: vi.fn() };
    vi.spyOn(doc, 'getElementById').mockReturnValue(
      mockElement as unknown as HTMLElement,
    );

    service.scrollToSection('projects');

    expect(doc.getElementById).toHaveBeenCalledWith('projects');
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
    });
  });

  it('scrollToSection is a no-op on SSR platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ScrollService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const ssrService = TestBed.inject(ScrollService);
    const ssrDoc = TestBed.inject(DOCUMENT);

    const spy = vi.spyOn(ssrDoc, 'getElementById');
    ssrService.scrollToSection('projects');

    expect(spy).not.toHaveBeenCalled();
  });

  it('initSectionObserver creates an IntersectionObserver with correct rootMargin and observes each section element', () => {
    const observeSpy = vi.fn();
    const disconnectSpy = vi.fn();
    let capturedCallback: IntersectionObserverCallback | null = null;
    let capturedOptions: IntersectionObserverInit | null = null;
    let constructorCallCount = 0;

    const mockHome = { id: 'home', getBoundingClientRect: () => ({ top: 0 }) } as unknown as HTMLElement;
    const mockAbout = { id: 'about', getBoundingClientRect: () => ({ top: 0 }) } as unknown as HTMLElement;

    vi.stubGlobal(
      'IntersectionObserver',
      class MockIO {
        observe = observeSpy;
        disconnect = disconnectSpy;
        constructor(
          callback: IntersectionObserverCallback,
          options?: IntersectionObserverInit,
        ) {
          constructorCallCount++;
          capturedCallback = callback;
          capturedOptions = options ?? null;
        }
      },
    );

    vi.spyOn(doc, 'getElementById').mockImplementation((id: string) => {
      if (id === 'home') return mockHome;
      if (id === 'about') return mockAbout;
      return null;
    });

    service.initSectionObserver(['home', 'about', 'missing']);

    expect(constructorCallCount).toBe(1);
    expect(typeof capturedCallback).toBe('function');
    expect(capturedOptions).toEqual({ rootMargin: '0px 0px -50% 0px' });
    expect(observeSpy).toHaveBeenCalledTimes(2);
    expect(observeSpy).toHaveBeenCalledWith(mockHome);
    expect(observeSpy).toHaveBeenCalledWith(mockAbout);
  });

  it('destroySectionObserver disconnects the observer', () => {
    const disconnectSpy = vi.fn();

    vi.stubGlobal(
      'IntersectionObserver',
      class MockIO {
        observe = vi.fn();
        disconnect = disconnectSpy;
      },
    );

    vi.spyOn(doc, 'getElementById').mockReturnValue({
      getBoundingClientRect: () => ({ top: 0 }),
    } as unknown as HTMLElement);

    service.initSectionObserver(['home']);
    service.destroySectionObserver();

    expect(disconnectSpy).toHaveBeenCalledOnce();
    // Second call must not throw (observer is nulled)
    expect(() => service.destroySectionObserver()).not.toThrow();
  });

  it('updateActiveSection picks the section closest to midpoint from above', () => {
    let capturedCallback: IntersectionObserverCallback | null = null;

    Object.defineProperty(doc.documentElement, 'clientHeight', {
      value: 800,
      configurable: true,
    });

    // midpoint = 400
    // home: top = -500 → distance = 900
    // projects: top = 200 → distance = 200 (closest above midpoint)
    // about: top = 600 → top > midpoint, not a candidate
    const mockHome = { getBoundingClientRect: () => ({ top: -500 }) } as unknown as HTMLElement;
    const mockProjects = { getBoundingClientRect: () => ({ top: 200 }) } as unknown as HTMLElement;
    const mockAbout = { getBoundingClientRect: () => ({ top: 600 }) } as unknown as HTMLElement;

    vi.stubGlobal(
      'IntersectionObserver',
      class MockIO {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor(callback: IntersectionObserverCallback) {
          capturedCallback = callback;
        }
      },
    );

    vi.spyOn(doc, 'getElementById').mockImplementation((id: string) => {
      if (id === 'home') return mockHome;
      if (id === 'projects') return mockProjects;
      if (id === 'about') return mockAbout;
      return null;
    });

    const replaceStateSpy = vi.spyOn(history, 'replaceState');

    service.initSectionObserver(['home', 'projects', 'about']);
    // entries are ignored — pass empty array
    capturedCallback!([], {} as IntersectionObserver);

    expect(service.activeSection()).toBe('projects');
    expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/#projects');
  });

  it('updateActiveSection sets URL to "/" when home is the active section', () => {
    let capturedCallback: IntersectionObserverCallback | null = null;

    Object.defineProperty(doc.documentElement, 'clientHeight', {
      value: 800,
      configurable: true,
    });

    // midpoint = 400; home at top=100 is the only section above midpoint
    const mockHome = { getBoundingClientRect: () => ({ top: 100 }) } as unknown as HTMLElement;
    const mockAbout = { getBoundingClientRect: () => ({ top: 900 }) } as unknown as HTMLElement;

    vi.stubGlobal(
      'IntersectionObserver',
      class MockIO {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor(callback: IntersectionObserverCallback) {
          capturedCallback = callback;
        }
      },
    );

    vi.spyOn(doc, 'getElementById').mockImplementation((id: string) => {
      if (id === 'home') return mockHome;
      if (id === 'about') return mockAbout;
      return null;
    });

    const replaceStateSpy = vi.spyOn(history, 'replaceState');

    service.initSectionObserver(['home', 'about']);
    capturedCallback!([], {} as IntersectionObserver);

    expect(service.activeSection()).toBe('home');
    expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/');
  });

  it('updateActiveSection does not update activeSection when no section is above midpoint', () => {
    let capturedCallback: IntersectionObserverCallback | null = null;

    Object.defineProperty(doc.documentElement, 'clientHeight', {
      value: 800,
      configurable: true,
    });

    // midpoint = 400; all sections are below midpoint
    const mockHome = { getBoundingClientRect: () => ({ top: 500 }) } as unknown as HTMLElement;
    const mockAbout = { getBoundingClientRect: () => ({ top: 900 }) } as unknown as HTMLElement;

    vi.stubGlobal(
      'IntersectionObserver',
      class MockIO {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor(callback: IntersectionObserverCallback) {
          capturedCallback = callback;
        }
      },
    );

    vi.spyOn(doc, 'getElementById').mockImplementation((id: string) => {
      if (id === 'home') return mockHome;
      if (id === 'about') return mockAbout;
      return null;
    });

    const replaceStateSpy = vi.spyOn(history, 'replaceState');

    service.initSectionObserver(['home', 'about']);
    capturedCallback!([], {} as IntersectionObserver);

    // Signal should retain its default value — no section was above midpoint
    expect(service.activeSection()).toBe('home'); // default, not updated
    expect(replaceStateSpy).not.toHaveBeenCalled();
  });

  it('destroySectionObserver clears sectionIds so a subsequent callback finds no sections', () => {
    let capturedCallback: IntersectionObserverCallback | null = null;

    Object.defineProperty(doc.documentElement, 'clientHeight', {
      value: 800,
      configurable: true,
    });

    const mockHome = { getBoundingClientRect: () => ({ top: 100 }) } as unknown as HTMLElement;

    vi.stubGlobal(
      'IntersectionObserver',
      class MockIO {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor(callback: IntersectionObserverCallback) {
          capturedCallback = callback;
        }
      },
    );

    vi.spyOn(doc, 'getElementById').mockImplementation((id: string) => {
      if (id === 'home') return mockHome;
      return null;
    });

    service.initSectionObserver(['home']);
    // Confirm it works before destroy
    capturedCallback!([], {} as IntersectionObserver);
    expect(service.activeSection()).toBe('home');

    service.destroySectionObserver();

    // Re-init with empty list; callback should not change activeSection
    service.initSectionObserver([]);
    // Manually call updateActiveSection via captured callback (new observer, no elements)
    capturedCallback!([], {} as IntersectionObserver);

    // activeSection should still be 'home' (no update possible with empty sectionIds)
    expect(service.activeSection()).toBe('home');
  });
});
