import type {
  SlidingWindowEntry,
  SlidingWindowProps,
  SlidingWindowResponse,
} from "../types";

export class SlidingWindow implements SlidingWindowProps {
  window: number;
  refreshRate: number;
  maxRequests: number;
  message: string;

  private store: Map<string, SlidingWindowEntry> = new Map();

  constructor(
    window: number,
    refreshRate: number,
    maxRequests: number,
    message: string = "Too many requests",
  ) {
    this.window = window;
    this.message = message;
    this.refreshRate = refreshRate;
    this.maxRequests = maxRequests;
  }

  checkLimit(key: string): SlidingWindowResponse {
    if (!this.store.has(key)) {
      this.store.set(key, {
        counter: 1,
        startTime: Date.now(),
      });
    }

    const entry = this.store.get(key)!;

    const timeElapsed = Date.now() - entry.startTime;
    const requestOffload = Math.floor(timeElapsed / this.refreshRate);

    if (timeElapsed >= this.refreshRate && entry.counter > 0) {
      entry.counter = Math.max(
        0,
        Math.min(entry.counter - requestOffload, this.maxRequests),
      );
      entry.startTime = Date.now();

      return {
        allowed: true,
        counter: entry.counter,
        message: this.message,
      };
    }
    if (entry.counter < this.maxRequests) {
      entry.counter += 1;
      return {
        allowed: true,
        counter: entry.counter,
        message: this.message,
      };
    }

    return {
      allowed: false,
      counter: entry.counter,
      message: this.message,
    };
  }
}
