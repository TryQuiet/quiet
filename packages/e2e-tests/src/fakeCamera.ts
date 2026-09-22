import fs from 'fs'
import os from 'os'
import path from 'path'
import qr from 'qr.js'

/**
 * Chromium plays a Y4M file as the camera when the app is launched with
 * `--use-file-for-fake-video-capture` (desktop main.ts adds the switches when IS_E2E=true
 * and E2E_FAKE_CAMERA_FILE names the file). This writes such a clip: a real QR code of
 * `text`, so the app's scanner decodes what the test intends.
 */
export interface QrClipOptions {
  width?: number
  height?: number
  frames?: number
  fps?: number
}

/** Environment variable the packaged app reads (see packages/desktop/src/shared/camera.ts). */
export const FAKE_CAMERA_FILE_ENV = 'E2E_FAKE_CAMERA_FILE'

const QUIET_ZONE = 4
const Y_BLACK = 16
const Y_WHITE = 235
const Y_BACKGROUND = 64
const UV_NEUTRAL = 128

export const writeQrY4m = (
  text: string,
  file: string,
  { width = 640, height = 480, frames = 5, fps = 10 }: QrClipOptions = {}
): string => {
  if (width % 2 || height % 2) throw new Error('Y4M 4:2:0 needs even dimensions')
  const modules = qr(text, { errorCorrectLevel: qr.ErrorCorrectLevel.M }).modules
  const cells = modules.length + QUIET_ZONE * 2
  const scale = Math.max(1, Math.floor((Math.min(width, height) * 0.9) / cells))
  const size = cells * scale
  const originX = Math.floor((width - size) / 2)
  const originY = Math.floor((height - size) / 2)

  const luma = Buffer.alloc(width * height, Y_BACKGROUND)
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const column = Math.floor(px / scale) - QUIET_ZONE
      const row = Math.floor(py / scale) - QUIET_ZONE
      const dark = row >= 0 && column >= 0 && row < modules.length && column < modules.length && modules[row][column]
      luma[(originY + py) * width + originX + px] = dark ? Y_BLACK : Y_WHITE
    }
  }
  const chroma = Buffer.alloc((width / 2) * (height / 2), UV_NEUTRAL)
  const header = Buffer.from(`YUV4MPEG2 W${width} H${height} F${fps}:1 Ip A1:1 C420jpeg\n`)
  const frame = Buffer.concat([Buffer.from('FRAME\n'), luma, chroma, chroma])
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, Buffer.concat([header, ...Array<Buffer>(frames).fill(frame)]))
  return file
}

/** A per-run path for a client's camera clip. */
export const fakeCameraFile = (label: string): string =>
  path.join(os.tmpdir(), `quiet-e2e-camera-${label}-${process.pid}.y4m`)

export const removeFakeCameraFile = (file: string): void => {
  if (fs.existsSync(file)) fs.unlinkSync(file)
}
