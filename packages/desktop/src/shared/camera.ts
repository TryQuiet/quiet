/** Renderer → main: ask the OS for camera access before the renderer calls getUserMedia. */
export const CAMERA_ACCESS_REQUEST = 'camera:request-access'

export type CameraAccessStatus = 'granted' | 'denied'

export interface CameraAccessResult {
  status: CameraAccessStatus
}

/** Set (with IS_E2E=true) to feed Chromium a Y4M clip as the camera instead of a device. */
export const FAKE_CAMERA_FILE_ENV = 'E2E_FAKE_CAMERA_FILE'
