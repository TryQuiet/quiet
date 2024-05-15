import { createLogger } from '../../logger'

const logger = createLogger('storybookLog')

export const storybookLog =
  (message: string) =>
  (...args: unknown[]): void => {
    logger.info(message)

    if (args.length > 0) {
      args.forEach(arg => {
        logger.info(arg)
      })
    }
  }
