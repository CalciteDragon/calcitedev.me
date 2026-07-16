import { CoalescedTaskScheduler } from './coalesced-task-scheduler';

describe('CoalescedTaskScheduler', () => {
  it('coalesces invalidations until the scheduled task runs', () => {
    const callbacks: Array<() => void> = [];
    const task = vi.fn();
    const scheduler = new CoalescedTaskScheduler(callback => callbacks.push(callback), task);

    scheduler.invalidate();
    scheduler.invalidate();
    scheduler.invalidate();

    expect(callbacks).toHaveLength(1);
    expect(task).not.toHaveBeenCalled();
    callbacks[0]();
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('allows a new task after the pending task completes', () => {
    const callbacks: Array<() => void> = [];
    const scheduler = new CoalescedTaskScheduler(callback => callbacks.push(callback), vi.fn());

    scheduler.invalidate();
    callbacks[0]();
    scheduler.invalidate();

    expect(callbacks).toHaveLength(2);
  });
});
