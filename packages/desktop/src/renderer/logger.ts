import { createQuietLogger } from '@quiet/logger'

const createLogger = createQuietLogger('desktop:renderer', true)
export const defaultLogger = createLogger('default')
export default createLogger
