# bucketflow

Rate limiting utilities for Node.js and TypeScript supporting Token Bucket, Fixed Window, Sliding Window, and Leaky Bucket algorithms.

## Features

- **Lightweight & Zero-Dependencies**: Pure TypeScript/JavaScript in-memory implementation.
- **Multiple Algorithms**:
  - `TokenBucket`: Classic token bucket refill algorithm.
  - `FixedWindow`: Fixed window counter rate limiting.
  - `SlidingWindow`: Dynamic rolling/sliding window rate limiting.
  - `LeakyBucket`: Queue-based request smoothing and leak processing.
- **Universal Framework Support**: Works seamlessly with Express, Fastify, NestJS, Next.js, Koa, or standard HTTP servers.

## Installation

```bash
npm install bucketflow
```

## Public Exports

`src/index.ts` exports the following limiters:

```ts
export { FixedWindow } from "./fixed-window";
export { TokenBucket } from "./token-bucket";
export { SlidingWindow } from "./sliding-window";
export { LeakyBucket } from "./leaky-bucket";
```

---

## Using the Limiters

### 1. `TokenBucket`

Refills tokens at a steady rate up to a max capacity.

```ts
import { TokenBucket } from "bucketflow";

const limiter = new TokenBucket(10, 1_000); // 10 tokens capacity, refills 1 token every 1000ms
const result = limiter.checkLimit("user-123");

console.log(result);
// { allowed: true, message: "Too many requests", tokens: 9 }
```

**Constructor:**
```ts
new TokenBucket(capacity: number, refillRate: number, message?: string)
```
- `capacity`: Maximum number of tokens available in the bucket.
- `refillRate`: Time interval in milliseconds between token refills.
- `message`: *(Optional)* Custom message returned when a request is rate limited.

---

### 2. `FixedWindow`

Tracks request counts within fixed time windows.

```ts
import { FixedWindow } from "bucketflow";

const limiter = new FixedWindow(100, 60_000, "Too many requests"); // 100 reqs per 60s
const result = limiter.checkLimit("user-123");

console.log(result);
// { allowed: true, reqRemaining: 99, message: "Too many requests" }
```

**Constructor:**
```ts
new FixedWindow(maxNum: number, window: number, message?: string)
```
- `maxNum`: Maximum allowed requests within the window.
- `window`: Window duration in milliseconds.
- `message`: *(Optional)* Custom message returned when a request is rate limited.

---

### 3. `SlidingWindow`

Smooths out traffic spikes across overlapping sub-intervals.

```ts
import { SlidingWindow } from "bucketflow";

const limiter = new SlidingWindow(60_000, 1_000, 100, "Too many requests");
const result = limiter.checkLimit("user-123");

console.log(result);
// { allowed: true, counter: 1, message: "Too many requests" }
```

**Constructor:**
```ts
new SlidingWindow(window: number, refreshRate: number, maxRequests: number, message?: string)
```
- `window`: Full window duration in milliseconds.
- `refreshRate`: Sub-window refresh interval in milliseconds.
- `maxRequests`: Maximum requests allowed within the window.
- `message`: *(Optional)* Custom message returned when a request is rate limited.

---

### 4. `LeakyBucket`

Queue-based rate limiter that smooths request flow by processing items at a fixed leak rate.

```ts
import { LeakyBucket } from "bucketflow";

const bucket = new LeakyBucket(5, 1_000); // Queue capacity of 5 requests

const added = bucket.addRequest({ id: 1, payload: "data" });
if (added) {
  console.log("Request queued successfully");
} else {
  console.log("Bucket full! Request rejected.");
}

// Process/leak one request from the queue
bucket.leak();
```

**Constructor:**
```ts
new LeakyBucket(capacity: number, leakRate: number)
```
- `capacity`: Maximum number of requests the queue can hold.
- `leakRate`: Time interval or rate indicator for processing requests.

**Methods:**
- `addRequest(req: any)`: Adds a request to the queue. Returns `true` if added, `false` if capacity is reached.
- `leak()`: Removes (leaks) the oldest request from the queue.

---

## Framework Integrations

### Express

```ts
import express from "express";
import { TokenBucket } from "bucketflow";

const app = express();
const limiter = new TokenBucket(100, 1_000);

app.use((req, res, next) => {
  const key = req.ip ?? "unknown";
  const result = limiter.checkLimit(key);

  if (!result.allowed) {
    res.status(429).json(result);
    return;
  }

  next();
});
```

### Fastify

```ts
import Fastify from "fastify";
import { TokenBucket } from "bucketflow";

const app = Fastify();
const limiter = new TokenBucket(100, 1_000);

app.addHook("preHandler", async (request, reply) => {
  const key = request.ip;
  const result = limiter.checkLimit(key);

  if (!result.allowed) {
    return reply.code(429).send(result);
  }
});
```

### NestJS

```ts
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { TokenBucket } from "bucketflow";

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly limiter = new TokenBucket(100, 1_000);

  use(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? "unknown";
    const result = this.limiter.checkLimit(key);

    if (!result.allowed) {
      res.status(429).json(result);
      return;
    }

    next();
  }
}
```

> **Note**: All limiters run in-memory local to the Node.js process. State is not shared across multi-node clusters or process restarts.

## License

MIT
