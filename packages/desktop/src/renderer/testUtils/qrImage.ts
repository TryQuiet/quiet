import qr from 'qr.js'

/**
 * QR images for tests and stories, made with react-qr-code's own encoder (qr.js) so a
 * "scanned" code is a real code of a real link, decoded by the real decoder.
 */
export const qrModules = (text: string): boolean[][] => qr(text, { errorCorrectLevel: qr.ErrorCorrectLevel.M }).modules

export interface QrImageOptions {
  /** Pixels per module. */
  scale?: number
  /** Quiet zone, in modules. */
  margin?: number
}

/** A camera-frame-like RGBA buffer holding the code; the shape jsQR reads (also ImageData's). */
export const qrImageData = (text: string, { scale = 4, margin = 4 }: QrImageOptions = {}): ImageData => {
  const modules = qrModules(text)
  const size = (modules.length + margin * 2) * scale
  const data = new Uint8ClampedArray(size * size * 4).fill(255)
  modules.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (!dark) return
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const offset = (((y + margin) * scale + dy) * size + (x + margin) * scale + dx) * 4
          data[offset] = 0
          data[offset + 1] = 0
          data[offset + 2] = 0
        }
      }
    })
  )
  return { data, width: size, height: size, colorSpace: 'srgb' } as ImageData
}

/** Paint the code onto a 2D context, `size` pixels square at (x, y), white quiet zone included. */
export const drawQr = (
  context: CanvasRenderingContext2D,
  text: string,
  size: number,
  x = 0,
  y = 0,
  margin = 4
): void => {
  const modules = qrModules(text)
  const cell = size / (modules.length + margin * 2)
  context.fillStyle = '#FFFFFF'
  context.fillRect(x, y, size, size)
  context.fillStyle = '#000000'
  modules.forEach((row, row_) =>
    row.forEach((dark, col) => {
      if (dark)
        context.fillRect(x + (col + margin) * cell, y + (row_ + margin) * cell, Math.ceil(cell), Math.ceil(cell))
    })
  )
}
