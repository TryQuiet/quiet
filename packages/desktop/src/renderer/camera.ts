import { ipcRenderer } from 'electron'
import { CAMERA_ACCESS_REQUEST, type CameraAccessResult } from '../shared/camera'

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
