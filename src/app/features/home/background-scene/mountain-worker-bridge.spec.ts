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
