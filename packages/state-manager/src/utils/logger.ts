import { createQuietLogger, DEFAULT_INTERNAL_LOG_METHOD, __nodeConsoleLogger } from '@quiet/logger'

export const createLogger = (() => {
  try {
    const { createWinstonQuietLogger } = require('@quiet/node-common')
    return createWinstonQuietLogger('state-manager')
  } catch (e) {
    return createQuietLogger(DEFAULT_INTERNAL_LOG_METHOD, 'state-manager')
  }
})()
