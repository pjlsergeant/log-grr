# grr

An opinionated way to use pino in apps

## Synopsis

```javascript
import { grr } from 'grr';

grr('startup').info('Server listening', { port: 3000 });
grr('foo.bar.baz').debug('Query executed', { table: 'users', ms: 12 });
```

## Opinions

### Categories

Every call to `grr()` sets a category as its first argument. Categories are pre-defined, hierarchical, and period-delimited:

```javascript
grr('foo.bar.baz').info("hi!", {"from": "me"})
```

produces a log payload including:

```json
{
  "$category": "foo.bar.baz",
  "$topics": ["foo", "foo.bar", "foo.bar.baz"],

  .. etc ...
  "msg": "hi!!",
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
grr('startup').info('Server listening', { "$requestId": "deadbeef", port: 3000 });
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

### Incremental log context

Wrap operations with addContext to automatically enrich logs with request metadata:

```javascript
app.use((req, res, next) => {
  addContext({
    requestId: req.headers['x-request-id'] || randomUUID(),
    apiEndpoint: `${req.method} ${req.path}`,
  }, next);
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

A "$phase" field is added to logs. If you haven't configured _grr_, it's set to "emergency". If _grr_ is configured, but no context has been added, it's "static". If context has been added, it's "request".

## Setup and Configuration

### Basic setup

Define your categories and create your logger:

```typescript
// logging.ts
import { createGrr } from 'grr';

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

| Variable | Default | Description |
|----------|---------|-------------|
| `GRR_LEVEL` | `info` | Minimum log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) |
| `GRR_PRETTY` | `true` if TTY | Human-readable output instead of JSON |
| `GRR_SERVICE` | `unknown` | Service name (appears as `$service`) |
| `GRR_ENV` | `development` | Environment identifier (appears as `$environment`) |

```bash
GRR_LEVEL=debug GRR_PRETTY=1 node scripts/migrate.js
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
  service: 'my-api',
  environment: 'prod.us-east-1',
  level: 'info',
  pretty: false,
});
```

This overrides any environment variable defaults.
