// qr.js ships no types. It encodes the QR codes the fake camera shows the app under test.
declare module 'qr.js' {
  interface QrJsCode {
    modules: boolean[][]
  }
  interface QrJsOptions {
    typeNumber?: number
    errorCorrectLevel?: number
  }
  interface QrJs {
    (data: string, options?: QrJsOptions): QrJsCode
    ErrorCorrectLevel: { L: number; M: number; Q: number; H: number }
  }
  const qr: QrJs
  export = qr
}
