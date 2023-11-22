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

    it('should call `console.info` with passed message', () => {
        storybookLog(consoleLogMessage)()

        expect(console.info).toHaveBeenCalledWith(consoleLogMessage)
        expect(console.info).toHaveBeenCalledTimes(1)
    })

    it('should call `console.info` with passed args', () => {
        const args = ['something', 5]
        storybookLog(consoleLogMessage)(...args)

        expect(console.info).toHaveBeenCalledWith(consoleLogMessage)
        expect(console.info).toHaveBeenCalledWith(args[0])
        expect(console.info).toHaveBeenCalledWith(args[1])
        expect(console.info).toHaveBeenCalledTimes(3)
    })
})
