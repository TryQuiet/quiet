import { createQuietLogger, DEFAULT_INTERNAL_LOG_METHOD } from '@quiet/logger'

export const createLogger = (() => {
  try {
    const { createWinstonQuietLogger } = require('@quiet/node-common')
    return createWinstonQuietLogger('utils')
  } catch (e) {
    return createQuietLogger(DEFAULT_INTERNAL_LOG_METHOD, 'utils')
  }
})()
