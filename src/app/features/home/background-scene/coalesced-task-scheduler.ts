export class CoalescedTaskScheduler {
  private pending = false;

  constructor(
    private readonly schedule: (callback: () => void) => void,
    private readonly task: () => void,
  ) {}

  invalidate(): void {
    if (this.pending) return;
    this.pending = true;
    this.schedule(() => {
      this.pending = false;
      this.task();
    });
  }
}
