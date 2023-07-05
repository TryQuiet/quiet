import { logger } from '@quiet/logger'

const createLogger = (name: string) => {
  return logger('backend')(name)
}

export default createLogger
