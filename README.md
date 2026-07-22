# bucketflow

Lightweight in-memory rate limiting utilities for Node.js and TypeScript.

## Installation

```bash
npm install bucketflow
```

## Usage

### Token bucket

```ts
import { TokenBucket } from "bucketflow";

const limiter = new TokenBucket(10, 1000);
const result = limiter.checkLimit("user-123");

if (!result.allowed) {
  console.log(result.message);
}
```

The constructor accepts `capacity`, `refillRate` in milliseconds, and an
optional rejection message.

### Fixed window

```ts
import { FixedWindow } from "bucketflow";

const limiter = new FixedWindow(100, 60_000);
const result = limiter.checkLimit("user-123");
```

The constructor accepts the maximum number of requests, the window duration
in milliseconds, and an optional rejection message.

### Sliding window

```ts
import { SlidingWindow } from "bucketflow";

const limiter = new SlidingWindow(60_000, 1_000, 100);
const result = limiter.checkLimit("user-123");
```

The constructor accepts the window duration, refresh rate, maximum requests,
and an optional rejection message. Durations and rates are in milliseconds.

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

## API

The package currently exports these classes:

- `TokenBucket`
- `FixedWindow`
- `SlidingWindow`

All limiters are in-memory and local to the running process. They do not share
state across multiple Node.js processes or servers, and state is lost when the
process restarts.

## License

MIT
