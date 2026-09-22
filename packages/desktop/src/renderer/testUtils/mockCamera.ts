/**
 * A camera for jsdom: getUserMedia resolves a stream (or rejects), the <video> reports a
 * live frame, and the 2D context hands back `frame` as the captured image. Returns a
 * restore function for afterEach.
 */
export interface MockCameraOptions {
  /** What the camera "sees"; undefined means no code in view. */
  frame?: ImageData
  /** getUserMedia rejects with this instead of resolving. */
  error?: Error
}

export const mockCamera = ({ frame, error }: MockCameraOptions = {}) => {
  let current = frame
  let failure = error
  const stop = jest.fn()
  const track = { stop, readyState: 'live' }
  const stream = { getTracks: () => [track] } as unknown as MediaStream
  const getUserMedia = jest.fn(async () => {
    if (failure) throw failure
    return stream
  })
  const context = {
    drawImage: jest.fn(),
    getImageData: jest.fn(() => current ?? { data: new Uint8ClampedArray(4 * 4 * 4).fill(255), width: 4, height: 4 }),
  }

  const mediaDevices = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices')
  const readyState = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'readyState')
  const videoWidth = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'videoWidth')
  const videoHeight = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'videoHeight')
  const play = HTMLMediaElement.prototype.play
  const getContext = HTMLCanvasElement.prototype.getContext

  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true })
  Object.defineProperty(HTMLMediaElement.prototype, 'readyState', { get: () => 4, configurable: true })
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
    get: () => current?.width ?? 640,
    configurable: true,
  })
  Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
    get: () => current?.height ?? 480,
    configurable: true,
  })
  HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined)
  HTMLCanvasElement.prototype.getContext = jest.fn(() => context) as unknown as typeof getContext

  const restoreDescriptor = (target: object, name: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) Object.defineProperty(target, name, descriptor)
    else delete (target as Record<string, unknown>)[name]
  }

  return {
    getUserMedia,
    /** The stream's track stop(): called once the code is accepted or the scanner unmounts. */
    stop,
    setFrame: (next?: ImageData) => {
      current = next
    },
    /** What the next getUserMedia does; `undefined` lets it succeed, as a granted camera does. */
    setError: (next?: Error) => {
      failure = next
    },
    restore: () => {
      restoreDescriptor(navigator, 'mediaDevices', mediaDevices)
      restoreDescriptor(HTMLMediaElement.prototype, 'readyState', readyState)
      restoreDescriptor(HTMLVideoElement.prototype, 'videoWidth', videoWidth)
      restoreDescriptor(HTMLVideoElement.prototype, 'videoHeight', videoHeight)
      HTMLMediaElement.prototype.play = play
      HTMLCanvasElement.prototype.getContext = getContext
    },
  }
}

export const cameraError = (name: 'NotAllowedError' | 'NotFoundError' | 'NotReadableError') =>
  new DOMException(name, name)
