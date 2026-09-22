import { ipcRenderer } from 'electron'
import { CAMERA_ACCESS_REQUEST, CAMERA_OPEN_PRIVACY_SETTINGS, type CameraAccessResult } from '../shared/camera'

/**
 * Ask the main process for the OS camera permission (the macOS system prompt lives
 * there). Anything but an explicit denial leaves the decision to getUserMedia, which
 * is also what happens outside Electron (Storybook).
 */
export const requestCameraAccess = async (): Promise<CameraAccessResult> => {
  if (!ipcRenderer?.invoke) return { status: 'granted' }
  try {
    const result: Partial<CameraAccessResult> | undefined = await ipcRenderer.invoke(CAMERA_ACCESS_REQUEST)
    return { status: result?.status === 'denied' ? 'denied' : 'granted' }
  } catch {
    return { status: 'granted' }
  }
}

/**
 * Ask the main process to open the OS page holding the camera toggle. Which page that is
 * is main's decision: nothing is sent, so this cannot be pointed at another URL. Resolves
 * false when no page was opened — there is none on Linux, and none outside Electron.
 */
export const openCameraPrivacySettings = async (): Promise<boolean> => {
  if (!ipcRenderer?.invoke) return false
  try {
    return (await ipcRenderer.invoke(CAMERA_OPEN_PRIVACY_SETTINGS)) === true
  } catch {
    return false
  }
}
