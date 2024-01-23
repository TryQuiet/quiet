import { logger } from '@quiet/logger'

const createLogger = (name: string) => {
  return logger('utils')(name)
}

export default createLogger
