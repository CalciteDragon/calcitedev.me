import { MountainWorkerBridge } from './mountain-worker-bridge';
import { DEFAULT_MOUNTAIN_CONFIG } from './mountain.config';

describe('MountainWorkerBridge', () => {
  let postMessageSpy: ReturnType<typeof vi.fn>;
  let terminateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    postMessageSpy = vi.fn();
    terminateSpy   = vi.fn();
    vi.stubGlobal('Worker', vi.fn(function () {
      return {
        postMessage: postMessageSpy,
        terminate:   terminateSpy,
      };
    }));
  });

  afterEach(() => vi.restoreAllMocks());

  it('constructs without error', () => {
    expect(() => new MountainWorkerBridge()).not.toThrow();
  });

  it('setCamY() posts a camY message', () => {
    const bridge = new MountainWorkerBridge();
    bridge.setCamY(0.75);
    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'camY', value: 0.75 }),
    );
  });

  it('records main-thread receipt time for worker performance samples', () => {
    const addEventListenerSpy = vi.fn();
    vi.stubGlobal('Worker', vi.fn(function () {
      return {
        postMessage: postMessageSpy,
        terminate: terminateSpy,
        addEventListener: addEventListenerSpy,
      };
    }));
    const callback = vi.fn();
    new MountainWorkerBridge(callback);
    const listener = addEventListenerSpy.mock.calls[0][1] as (event: MessageEvent) => void;

    listener({ data: { type: 'perf', mainReceivedAt: 0 } } as MessageEvent);

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      type: 'perf',
      mainReceivedAt: expect.any(Number),
    }));
  });

  it('resize() posts a resize message', () => {
    const bridge = new MountainWorkerBridge();
    bridge.resize(1280, 720);
    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'resize', width: 1280, height: 720 }),
    );
  });

  it('setConfig() posts a config message', () => {
    const bridge = new MountainWorkerBridge();
    bridge.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'config', config: DEFAULT_MOUNTAIN_CONFIG }),
    );
  });

  it('destroy() calls worker.terminate()', () => {
    const bridge = new MountainWorkerBridge();
    bridge.destroy();
    expect(terminateSpy).toHaveBeenCalledTimes(1);
  });
});
