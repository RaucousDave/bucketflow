import type { LeakyBucketProps } from "../types";

export class LeakyBucket implements LeakyBucketProps {
  capacity: number;
  queue: Array<any>;
  leakRate: number;

  constructor(capacity: number, leakRate: number) {
    this.capacity = capacity;
    this.queue = [];
    this.leakRate = leakRate;
  }

  addRequest(req: any) {
    if (this.queue.length >= this.capacity) {
      return false;
    }
    this.queue.push(req);
    return true;
  }

  leak() {
    if (this.queue.length > 0) {
      this.queue.shift();
    }
  }
}
