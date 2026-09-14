import { drawQr } from '../../testUtils/qrImage'

/**
 * A camera for Storybook, where no device exists: getUserMedia hands the scanner a
 * MediaStream captured from a canvas (Chrome's canvas.captureStream), so the real
 * <video> → canvas → jsQR pipeline runs. `code` paints a real QR code of the given
 * text; `blank` is a plain grey feed; the rest reproduce the failure modes.
 */
export type StoryCamera =
  { kind: 'code'; text: string } | { kind: 'blank' } | { kind: 'pending' } | { kind: 'denied' } | { kind: 'none' }

const WIDTH = 640
const HEIGHT = 480
const CODE_SIZE = 400
const FPS = 10

const paint = (context: CanvasRenderingContext2D, camera: StoryCamera) => {
  context.fillStyle = '#3B3B3B'
  context.fillRect(0, 0, WIDTH, HEIGHT)
  if (camera.kind === 'code') drawQr(context, camera.text, CODE_SIZE, (WIDTH - CODE_SIZE) / 2, (HEIGHT - CODE_SIZE) / 2)
}

const canvasStream = (camera: StoryCamera): MediaStream => {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new DOMException('No 2D context', 'NotReadableError')
  paint(context, camera)
  const stream = canvas.captureStream(FPS)
  // captureStream emits a frame per paint; keep painting until the scanner stops the track.
  const timer = setInterval(() => {
    if (stream.getVideoTracks().every(track => track.readyState === 'ended')) {
      clearInterval(timer)
      return
    }
    paint(context, camera)
  }, 1000 / FPS)
  return stream
}

/** Replace navigator.mediaDevices for the story's lifetime; returns the undo. */
export const installStoryCamera = (camera: () => StoryCamera): (() => void) => {
  const getUserMedia = async (): Promise<MediaStream> => {
    const current = camera()
    switch (current.kind) {
      case 'pending':
        return new Promise<MediaStream>(() => {})
      case 'denied':
        throw new DOMException('Permission denied', 'NotAllowedError')
      case 'none':
        throw new DOMException('Requested device not found', 'NotFoundError')
      default:
        return canvasStream(current)
    }
  }
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true })
  return () => {
    delete (navigator as { mediaDevices?: unknown }).mediaDevices
  }
}
