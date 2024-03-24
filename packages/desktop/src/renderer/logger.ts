import { createElectronLogger } from '@quiet/logger'

const createLogger = createElectronLogger('desktop:renderer', true)
export const defaultLogger = createLogger('default')
export default createLogger
