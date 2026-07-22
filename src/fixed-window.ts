import type { FixedWindowProps, Entry, FixedWindowResponse } from "../types";

export class FixedWindow implements FixedWindowProps {
  private store: Map<string, Entry> = new Map();
  message: string;
  maxNum: number;
  window: number;

  constructor(
    maxNum: number,
    window: number,
    message: string = "Too many requests",
  ) {
    this.message = message;
    this.maxNum = maxNum;
    this.window = window;
  }
  checkLimit(key: string): FixedWindowResponse {
    if (!this.store.has(key)) {
      this.store.set(key, {
        count: 1,
        windowEnd: Date.now() + this.window,
        windowStart: Date.now(),
      });

      return {
        allowed: true,
        reqRemaining: this.maxNum - 1,
        message: this.message,
      };
    }
    const entry = this.store.get(key)!;

    if (Date.now() > entry.windowEnd) {
      entry.count = 0;
      entry.windowEnd = Date.now() + this.window;
      entry.windowStart = Date.now();

      return {
        allowed: true,
        reqRemaining: this.maxNum,
        message: this.message,
      };
    }

    if (entry.count >= this.maxNum) {
      return {
        allowed: false,
        reqRemaining: 0,
        message: this.message,
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      reqRemaining: this.maxNum - 1,
      message: this.message,
    };
  }
}
