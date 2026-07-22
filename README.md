# bucketflow

Lightweight in-memory rate limiting utilities for Node.js and TypeScript.

## Installation

```bash
npm install bucketflow
```

## Public exports

`src/index.ts` currently exports these three classes:

```ts
export { FixedWindow } from "./fixed-window";
export { TokenBucket } from "./token-bucket";
export { SlidingWindow } from "./sliding-window";
```

Each limiter stores its counters in memory and exposes a `checkLimit(key)`
method. The `key` identifies the client, user, IP address, API key, or any
other group that should have its own limit.

## Using the limiters

### `TokenBucket`

```ts
import { TokenBucket } from "bucketflow";

const limiter = new TokenBucket(10, 1_000);
const result = limiter.checkLimit("user-123");

console.log(result);
// { allowed: true, message: "Too many requests", tokens: 9 }
```

Constructor:

```ts
new TokenBucket(capacity, refillRate, message?)
```

- `capacity`: maximum number of tokens.
- `refillRate`: milliseconds between token refills.
- `message`: optional message returned when a request is rejected.

`checkLimit(key)` returns `{ allowed, message, tokens }`.

### `FixedWindow`

```ts
import { FixedWindow } from "bucketflow";

const limiter = new FixedWindow(100, 60_000, "Too many requests");
const result = limiter.checkLimit("user-123");

console.log(result);
// { allowed: true, reqRemaining: 99, message: "Too many requests" }
```

Constructor:

```ts
new FixedWindow(maxNum, window, message?)
```

- `maxNum`: maximum number of requests in the window.
- `window`: window duration in milliseconds.
- `message`: optional message returned when a request is rejected.

`checkLimit(key)` returns `{ allowed, reqRemaining, message }`.

### `SlidingWindow`

```ts
import { SlidingWindow } from "bucketflow";

const limiter = new SlidingWindow(60_000, 1_000, 100, "Too many requests");
const result = limiter.checkLimit("user-123");

console.log(result);
// { allowed: true, counter: 1, message: "Too many requests" }
```

Constructor:

```ts
new SlidingWindow(window, refreshRate, maxRequests, message?)
```

- `window`: window duration in milliseconds.
- `refreshRate`: counter refresh interval in milliseconds.
- `maxRequests`: maximum requests tracked by the limiter.
- `message`: optional message returned when a request is rejected.

`checkLimit(key)` returns `{ allowed, counter, message }`.

## Return values

Each limiter returns an object with an `allowed` boolean and a message. The
additional field depends on the limiter:

- `TokenBucket`: `tokens` is the number of tokens remaining.
- `FixedWindow`: `reqRemaining` is the reported number of requests remaining.
- `SlidingWindow`: `counter` is the current request counter.

## Framework integrations

Bucketflow does not depend on a web framework. You can call a limiter from
middleware, hooks, guards, or any other request boundary.

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

You can use `FixedWindow` or `SlidingWindow` in the same middleware by
replacing the limiter construction:

```ts
const limiter = new FixedWindow(100, 60_000);
// or
const limiter = new SlidingWindow(60_000, 1_000, 100);
```

### Fastify

Fastify can use a limiter in a `preHandler` hook:

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

This works with Fastify because the package has no Express-specific or
NestJS-specific dependencies; the limiter can be called from Fastify hooks.

### NestJS

In NestJS, the limiter can be used from middleware:

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

Register the middleware in a module with `MiddlewareConsumer`, or adapt the
same pattern into a NestJS guard when route-level control is preferred.

The same middleware pattern works with `FixedWindow` and `SlidingWindow`:

```ts
private readonly limiter = new FixedWindow(100, 60_000);
// or
private readonly limiter = new SlidingWindow(60_000, 1_000, 100);
```

All limiters are in-memory and local to the running process. They do not share
state across multiple Node.js processes or servers, and state is lost when the
process restarts.

## License

MIT
