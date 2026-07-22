import type {
  TokenBucketProps,
  TokenEntry,
  TokenEntryResponse,
} from "../types";

export class TokenBucket implements TokenBucketProps {
  capacity: number;
  refillRate: number;
  private store: Map<string, TokenEntry> = new Map();
  message: string;

  constructor(
    capacity: number,
    refillRate: number,
    message: string = "Too many requests",
  ) {
    this.capacity = capacity;
    this.message = message;
    this.refillRate = refillRate;
  }

  checkLimit(key: string): TokenEntryResponse {
    if (!this.store.has(key)) {
      this.store.set(key, {
        tokens: this.capacity,
        tokenWindow: Date.now(),
      });
    }

    const entry = this.store.get(key)!;

    const timeRemaining = Date.now() - entry.tokenWindow;
    const tokensToAdd = Math.floor(timeRemaining / this.refillRate);

    if (timeRemaining >= this.refillRate && entry.tokens < this.capacity) {
      entry.tokens += Math.min(tokensToAdd, this.capacity);
      entry.tokenWindow += this.refillRate;
    }

    if (entry.tokens > 0) {
      entry.tokens -= 1;
      entry.tokenWindow = Date.now();

      return {
        allowed: true,
        message: this.message,
        tokens: entry.tokens,
      };
    }
    return {
      allowed: false,
      message: this.message,
      tokens: entry.tokens,
    };
  }
}
