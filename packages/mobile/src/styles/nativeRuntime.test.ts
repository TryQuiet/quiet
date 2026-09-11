describe('native styling runtime', () => {
  it('initializes when React Native exposes HTMLElement without a browser document', () => {
    const originalHTMLElement = Object.getOwnPropertyDescriptor(global, 'HTMLElement')
    Object.defineProperty(global, 'HTMLElement', { configurable: true, value: class HTMLElement {} })

    try {
      expect(window).toBe(global)
      expect(typeof document).toBe('undefined')

      jest.isolateModules(() => {
        const { ThemeProvider } = require('styled-components/native')
        expect(typeof ThemeProvider).toBe('function')
      })
    } finally {
      if (originalHTMLElement) {
        Object.defineProperty(global, 'HTMLElement', originalHTMLElement)
      } else {
        Reflect.deleteProperty(global, 'HTMLElement')
      }
    }
  })
})
