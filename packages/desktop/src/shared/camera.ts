/** Renderer → main: ask the OS for camera access before the renderer calls getUserMedia. */
export const CAMERA_ACCESS_REQUEST = 'camera:request-access'

/**
 * Renderer → main: open the OS page holding the camera toggle, so a user who refused
 * the camera has somewhere to go. The renderer names no URL: which page (if any) exists
 * is the main process's platform question, not the renderer's.
 */
export const CAMERA_OPEN_PRIVACY_SETTINGS = 'camera:open-privacy-settings'

export type CameraAccessStatus = 'granted' | 'denied'

export interface CameraAccessResult {
  status: CameraAccessStatus
}

/** Set (with IS_E2E=true) to feed Chromium a Y4M clip as the camera instead of a device. */
export const FAKE_CAMERA_FILE_ENV = 'E2E_FAKE_CAMERA_FILE'
