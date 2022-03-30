Script for generating many messages on given community channel.
Must be run from the root of integration-tests package.

Usage:

`ts-node src/bot/bot.ts <options>`

`ts-node src/bot/bot.ts --help`

Example:

`DEBUG=waggle*,bot* ts-node src/bot/bot.ts -r j4sdacfjsizgh7psat2bhtneiezqhk3ghvqmr4kifqdvxvcn52ug5xad -c general -m 100 -u 2`
