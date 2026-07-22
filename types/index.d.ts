export interface FixedWindowProps  {
  message: string;
  maxNum: number;
  window: number;
}
export type FixedWindowResponse = {
  allowed: boolean;
  reqRemaining: number;
  message: string;
  resetIn?: number
}

export type Entry = {
  count: number;
  windowEnd: number
  windowStart: number
}
export interface TokenBucketProps{
  message: string;
  capacity: number;
  refillRate: number
}

export type TokenEntry = {
  tokens: number;
  tokenWindow: number; // this should signify the first time the user sent a request, then reset after the bucket refills
  // it should be incremented by the passed in refillRate and then computed against the current time of a new request, if the difference is equal to or greater than the window or refillRate, then the token should be incremented
}

export type TokenEntryResponse = {
  allowed: boolean;
  message: string;
  tokens: number;
}


export interface SlidingWindowProps {
  window: number;
  message: string;
  refreshRate: number;
  maxRequests: number;
}

export interface SlidingWindowResponse {
  allowed: boolean;
  counter: number;
  message: string
}
export type SlidingWindowEntry = {
  counter: number;
  startTime: number
};

export interface LeakyBucketProps{
  capacity: number
  leakRate: number
  addRequest: (req: any) => boolean
  leak: () => void
}
