# node-common

The `node-common` package is a collection of common functions that are only usable in a node environment (e.g. shared filesystem functionality).  This split from `common` is necessary to support both desktop and mobile as well as the distinction between backend and frontend in mobile environments (backend still runs in node on mobile).

## Logging

_See the `logger` README for a more detailed description of how to use the QuietLogger._

### The winston logger

In node environments we allow logging to files using `winston` as the internal logging library and `QuietLogger` as a wrapper around it.  This allows a shared interface and logging format between all environments while enabling more robust functionality in node.

#### Creating a winston logger for a package

```
import { createWinstonQuietLogger } from '@quiet/node-common'

export const createLogger = createWinstonQuietLogger('backend')
```

This creates the base winston logger that all modules will extend from.

#### Logging to files

By default the winston logger outputs to the console and to two files: `log_<date>.log` and `error_<date>.log`.  The former contains all quiet log levels that are enabled and the latter contains only error level logs.

File output can be controlled via the feature flags

#### Feature flags

* `LOG_DIR` sets the directory that logs are output to (note: excluding this parameter will disable file logging)
* `LOG_TO_FILE` defaults to `true` and setting it to `false` will disable file logging
