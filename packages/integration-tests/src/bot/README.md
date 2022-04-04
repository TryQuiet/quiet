Script for generating many messages on given community channel.
Must be run from the root of integration-tests package.

Usage:

`ts-node src/bot/bot.ts <options>`

`ts-node src/bot/bot.ts --help`

Example:

`DEBUG=waggle*,bot* ts-node src/bot/bot.ts -r j4sdacfjsizgh7psat2bhtneiezqhk3ghvqmr4kifqdvxvcn52ug5xad -c general -m 100 -u 2`

Note:

Bot can sometimes get stuck at registration because of "user aborted request" error from registrar.
Temporary workaround is to modify condition in nectar's `handleErrors.saga.ts` to make it retry also at `error.code === ErrorCodes.SERVICE_UNAVAILABLE`
