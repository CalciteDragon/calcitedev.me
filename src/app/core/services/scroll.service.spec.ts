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

  it('initSectionObserver creates an IntersectionObserver and observes each section element', () => {
    const observeSpy = vi.fn();
    const disconnectSpy = vi.fn();
    let capturedCallback: IntersectionObserverCallback | null = null;
    let capturedOptions: IntersectionObserverInit | null = null;
    let constructorCallCount = 0;

    const mockHome = { id: 'home' } as HTMLElement;
    const mockAbout = { id: 'about' } as HTMLElement;

    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class MockIO {
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
    } as unknown as typeof IntersectionObserver;

    vi.spyOn(doc, 'getElementById').mockImplementation((id: string) => {
      if (id === 'home') return mockHome;
      if (id === 'about') return mockAbout;
      return null;
    });

    service.initSectionObserver(['home', 'about', 'missing']);

    expect(constructorCallCount).toBe(1);
    expect(typeof capturedCallback).toBe('function');
    expect(capturedOptions).toEqual({ rootMargin: '-10% 0px -85% 0px' });
    expect(observeSpy).toHaveBeenCalledTimes(2);
    expect(observeSpy).toHaveBeenCalledWith(mockHome);
    expect(observeSpy).toHaveBeenCalledWith(mockAbout);

    globalThis.IntersectionObserver = original;
  });

  it('destroySectionObserver disconnects the observer', () => {
    const disconnectSpy = vi.fn();

    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class MockIO {
      observe = vi.fn();
      disconnect = disconnectSpy;
    } as unknown as typeof IntersectionObserver;

    vi.spyOn(doc, 'getElementById').mockReturnValue({} as HTMLElement);

    service.initSectionObserver(['home']);
    service.destroySectionObserver();

    expect(disconnectSpy).toHaveBeenCalledOnce();

    globalThis.IntersectionObserver = original;
  });
});
