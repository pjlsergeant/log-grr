# @sgntai/grr

An opinionated way to use pino in apps

## Synopsis

```typescript
// logging.ts
import { createGrr } from '@sgntai/grr';

type Categories = 'startup' | 'db' | 'api';
export const { grr, addContext } = createGrr<Categories>();

// app.ts
import { grr } from './logging';

grr('startup').info('Server listening', { port: 3000 });
grr('db').debug('Query executed', { table: 'users', ms: 12 });
```

## Opinions

### Categories

Every call to `grr()` sets a category as its first argument. Categories are pre-defined, hierarchical, and period-delimited:

```javascript
grr('foo.bar.baz').info('hi!', { from: 'me' });
```

produces a log payload including:

```json
{
  "$category": "foo.bar.baz",
  "$topics": ["foo.bar.baz", "foo.bar", "foo"],

  .. etc ...
  "msg": "hi!",
  "debug": { "from": "me" },
  ...
}
```

Categories are pre-defined so you don't fat-finger anything important:

```typescript
type Categories = 'startup' | 'db' | 'db.postgres' | 'api' | 'api.users' | 'worker';
const { grr } = createGrr<Categories>();
```

### Log field organization

Output log fields are organized to try and make them easy to filter for in output systems.

```javascript
grr('startup').info('Server listening', { $requestId: 'deadbeef', port: 3000 });
```

produces:

```json
{
  // Pino fields
  "level": 30,
  "time": 1706284800000,
  "msg": "Server listening",

  // Category and topics are automatically included
  "$category": "startup",
  "$topics": ["startup"],

  // Fields prefixed with a $ are included in the top level
  "$requestId": "deadbeef",

  // Other fields are put into `debug`
  "debug": {
    "port": 3000
  }
}
```

### Message-first signature

Unlike pino/bunyan which use `logger.info(obj, message)`, grr uses **message first**:

```javascript
// grr style (message first)
grr('api').error('Operation failed', { error: err, userId: 123 });

// NOT pino style (object first) - this won't work as expected
// logger.error(err, 'Operation failed');
```

Errors passed in fields are automatically serialized to include `name`, `message`, and `stack`. Custom error classes also get a `_class` field:

```javascript
grr('api').error('Request failed', { error: new MyCustomError('oops') });
// debug.error = { name: 'MyCustomError', message: 'oops', stack: '...', _class: 'MyCustomError' }
```

### Incremental log context

Wrap operations with addContext to automatically enrich logs with request metadata:

```javascript
app.use((req, res, next) => {
  addContext(
    {
      requestId: req.headers['x-request-id'] || randomUUID(),
      apiEndpoint: `${req.method} ${req.path}`,
    },
    next,
  );
});

// and then...

app.get('/users/:id', (req, res) => {
  grr('api.users').info('Fetching user');
  // ...
});
```

adds:

```json
  {
    "$requestId": "deadbeef",
    "$apiEndpoint": "GET /users/:id",

  ... etc ...
  }
```

Nested calls merge with the parent context:

```javascript
addContext({ requestId: '123' }, () => {
  // later, once we know who the user is...
  addContext({ username: 'alice', userId: 42 }, () => {
    grr('api').info('Doing something');
    // logs include requestId, username, and userId
  });
});
```

(when $fields overlap, the most recently set ones "win", with the highest precedence being ones passed into the log call itself, so you could in theory override the "$username" above by passing in a "$username" to the log call itself)

### Phases

A `$phase` field is added to logs. If no context has been added, it's `"static"`. If context has been added, it's `"request"`.

## Setup and Configuration

### Basic setup

Define your categories and create your logger:

```typescript
// logging.ts
import { createGrr } from '@sgntai/grr';

type Categories = 'startup' | 'db' | 'db.postgres' | 'api' | 'api.users' | 'worker';
const { grr, addContext, getContext } = createGrr<Categories>();

export { grr, addContext, getContext };
```

Then use it:

```typescript
import { grr } from './logging';

grr('startup').info('Hello');
```

No further initialization is needed. Configuration comes from environment variables:

| Variable            | Default          | Description                                                            |
| ------------------- | ---------------- | ---------------------------------------------------------------------- |
| `GRR_LEVEL`         | `info`           | Minimum log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) |
| `GRR_PRETTY`        | `true` if TTY    | Human-readable output (`1`, `0`, `true`, `false`)                      |
| `GRR_SHOW_METADATA` | `false` if pretty | Show `$`-prefixed metadata in pretty mode (`1`, `0`, `true`, `false`) |

```bash
GRR_LEVEL=debug GRR_PRETTY=1 node scripts/migrate.js
```

### Pretty mode and metadata

In pretty mode, `$`-prefixed metadata fields (`$category`, `$topics`, `$requestId`, etc.) are hidden by default to reduce clutter in human-readable output. The `debug` object is also flattened so its contents appear at the top level. JSON output is unaffected.

To show metadata in pretty mode:

```bash
GRR_PRETTY=1 GRR_SHOW_METADATA=1 node app.js
```

Or programmatically:

```typescript
initGrr({ pretty: true, showMetadata: true });
```

### Explicit configuration

For programmatic control, export and call `initGrr`:

```typescript
// logging.ts
const { grr, initGrr, addContext, getContext } = createGrr<Categories>();
export { grr, initGrr, addContext, getContext };

// server.ts
import { initGrr } from './logging';

initGrr({
  level: 'info',
  pretty: false,
  defaultFields: {
    $service: 'my-api',
    $environment: 'prod.us-east-1',
    $version: process.env.VERSION,
  },
});
```

The `defaultFields` option adds static metadata to every log entry. Use it for service identity, version, team, etc.

### Multi-transport setup (Axiom, DataDog, etc)

For multi-target logging, pass transport targets directly:

```typescript
initGrr({
  transports: [
    { target: 'pino/file', options: { destination: 1 }, level: 'info' },
    { target: '@axiomhq/pino', options: { dataset: 'logs', token: '...' }, level: 'trace' },
    {
      target: 'pino-datadog-transport',
      options: {
        /* ... */
      },
      level: 'trace',
    },
  ],
  level: 'trace',
  defaultFields: {
    $service: 'my-api',
    $environment: 'prod',
  },
});
```

When using `transports`, the `level` option sets the minimum level for the pino instance (defaults to `trace`). Each transport can have its own level filter.

### Custom pino instance (full control)

For complete control over pino configuration, pass your own pino instance:

```typescript
import pino from 'pino';

const pinoInstance = pino(
  { level: 'trace' },
  pino.transport({
    targets: [
      { target: 'pino/file', options: { destination: 1 }, level: 'info' },
      { target: '@axiomhq/pino', options: { dataset: 'logs', token: '...' }, level: 'trace' },
    ],
  }),
);

initGrr({
  pino: pinoInstance,
  defaultFields: {
    $service: 'my-api',
    $environment: 'prod',
  },
});
```

When using a custom pino instance, `GRR_LEVEL`, `GRR_PRETTY`, and `GRR_SHOW_METADATA` are ignored (a warning is logged if they're set).
