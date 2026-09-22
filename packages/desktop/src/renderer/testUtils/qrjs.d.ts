// qr.js ships no types. It is react-qr-code's encoder, used here to make QR images for tests and stories.
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
