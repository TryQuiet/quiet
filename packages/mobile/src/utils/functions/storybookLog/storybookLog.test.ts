import { QuietLogger } from '@quiet/logger'
import { storybookLog } from './storybookLog.function'

describe('storybookLog function', () => {
  const consoleLogMessage = 'storybookLog called'

  beforeEach(() => {
    jest.spyOn(console, 'info')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return a function', () => {
    const returned = storybookLog(consoleLogMessage)

    expect(typeof returned).toEqual('function')
  })

  it('should call `QuietLogger.prototype.info` with passed message', () => {
    storybookLog(consoleLogMessage)()

    expect(QuietLogger.prototype.info).toHaveBeenCalledWith(consoleLogMessage)
    expect(QuietLogger.prototype.info).toHaveBeenCalledTimes(1)
  })

  it('should call `QuietLogger.prototype.info` with passed args', () => {
    const args = ['something', 5]
    storybookLog(consoleLogMessage)(...args)

    expect(QuietLogger.prototype.info).toHaveBeenCalledWith(consoleLogMessage)
    expect(QuietLogger.prototype.info).toHaveBeenCalledWith(args[0])
    expect(QuietLogger.prototype.info).toHaveBeenCalledWith(args[1])
    expect(QuietLogger.prototype.info).toHaveBeenCalledTimes(3)
  })
})
