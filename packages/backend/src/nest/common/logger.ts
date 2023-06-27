import { logger } from '@quiet/logger'

const createLogger = (name: string) => {
  return {
    log: logger('backend')(name)
  }
}

export default createLogger
