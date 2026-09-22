import { ipcMain, shell, systemPreferences, type App, type Session, type WebContents } from 'electron'
import { pathToFileURL } from 'url'
import {
  CAMERA_ACCESS_REQUEST,
  CAMERA_OPEN_PRIVACY_SETTINGS,
  FAKE_CAMERA_FILE_ENV,
  type CameraAccessResult,
} from '../shared/camera'
import { createLogger } from './logger'

const logger = createLogger('cameraPermission')

/** Decides whether a permission request comes from the app's own renderer showing the app's own page. */
export type IsAppRenderer = (webContents: WebContents | null, requestingUrl: string | undefined) => boolean

/**
 * The app's page is loaded from `file://<dist>/index.html?dataPort=…#/`, whose origin is
 * opaque, so the page is recognised by its path rather than by origin.
 */
export const isAppPageUrl = (requestingUrl: string | undefined, indexHtmlPath: string): boolean => {
  if (!requestingUrl) return false
  try {
    const url = new URL(requestingUrl)
    return url.protocol === 'file:' && url.pathname === pathToFileURL(indexHtmlPath).pathname
  } catch {
    return false
  }
}

const onlyVideo = (mediaTypes: unknown): boolean =>
  Array.isArray(mediaTypes) && mediaTypes.length > 0 && mediaTypes.every(type => type === 'video')

/**
 * Electron grants every permission unless a handler is installed, and the app relies on
 * that (renderer `new Notification(...)`). So everything but `media` keeps the default,
 * and `media` is narrowed to the camera (no microphone), for the app's own renderer only.
 *
 * REVISIT ON THE ELECTRON 45 UPGRADE. On 44 a screen-capture request arrives as `media`
 * with an empty `mediaTypes`, which `onlyVideo` denies. Electron 45 reports it as
 * `display-capture` instead, which the grant-everything-else default below would let
 * through silently. The app does not capture the screen, so `display-capture` should be
 * denied explicitly rather than inherit that default.
 */
export const registerCameraPermissionHandlers = (targetSession: Session, isAppRenderer: IsAppRenderer): void => {
  targetSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (permission !== 'media') {
      callback(true)
      return
    }
    const request = details as Electron.MediaAccessPermissionRequest
    const granted = isAppRenderer(webContents, request.requestingUrl) && onlyVideo(request.mediaTypes)
    logger.info(`Camera permission request from ${request.requestingUrl}: ${granted ? 'granted' : 'denied'}`)
    callback(granted)
  })
  targetSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission !== 'media') return true
    // Only the microphone is refused. Electron 44 calls this handler mid-getUserMedia with
    // `mediaType` absent, so testing for `=== 'video'` answered "no camera here" to a question
    // about the camera. The request handler above is what actually gates the stream, but this one
    // is what `navigator.permissions.query` and repeat calls read, so it has to answer honestly.
    return isAppRenderer(webContents, details.requestingUrl ?? requestingOrigin) && details.mediaType !== 'audio'
  })
}

type MediaAccessPreferences = Pick<typeof systemPreferences, 'askForMediaAccess' | 'getMediaAccessStatus'>

/**
 * macOS prompts the user through the system dialog (once; later calls report the stored
 * answer). Windows only has a privacy setting to read. Elsewhere the renderer's
 * getUserMedia is the last word.
 */
export const resolveCameraAccess = async (
  platform: NodeJS.Platform,
  preferences: MediaAccessPreferences = systemPreferences
): Promise<CameraAccessResult> => {
  if (platform === 'darwin') {
    const granted = await preferences.askForMediaAccess('camera')
    return { status: granted ? 'granted' : 'denied' }
  }
  if (platform === 'win32') {
    return { status: preferences.getMediaAccessStatus('camera') === 'denied' ? 'denied' : 'granted' }
  }
  return { status: 'granted' }
}

export const registerCameraAccessRequestHandler = (platform: NodeJS.Platform = process.platform): void => {
  ipcMain.handle(CAMERA_ACCESS_REQUEST, async (): Promise<CameraAccessResult> => {
    const result = await resolveCameraAccess(platform)
    logger.info(`Camera access on ${platform}: ${result.status}`)
    return result
  })
}

/**
 * Where the camera toggle lives once the OS has stored a refusal. macOS only ever shows
 * its permission dialog once, and Windows never shows one at all, so on both the setting
 * is the only way back and the app has to be able to point at it. Linux has no such
 * page — no permission layer, no toggle — so nothing is offered there.
 */
export const CAMERA_PRIVACY_SETTINGS_URL: Partial<Record<NodeJS.Platform, string>> = {
  darwin: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Camera',
  win32: 'ms-settings:privacy-webcam',
}

/**
 * Opens that page. The URL is chosen here from `platform`, never taken from the renderer,
 * so a compromised renderer cannot turn this channel into `shell.openExternal(anything)`.
 * Returns whether a page was opened, which is what the renderer is told.
 */
export const openCameraPrivacySettings = async (
  platform: NodeJS.Platform,
  openExternal: (url: string) => Promise<void> = url => shell.openExternal(url)
): Promise<boolean> => {
  const url = CAMERA_PRIVACY_SETTINGS_URL[platform]
  if (!url) {
    logger.info(`No camera privacy settings page on ${platform}`)
    return false
  }
  try {
    await openExternal(url)
    logger.info(`Opened the camera privacy settings page on ${platform}`)
    return true
  } catch (error) {
    logger.error(`Could not open ${url} on ${platform}`, error)
    return false
  }
}

export const registerCameraPrivacySettingsHandler = (platform: NodeJS.Platform = process.platform): void => {
  ipcMain.handle(CAMERA_OPEN_PRIVACY_SETTINGS, (): Promise<boolean> => openCameraPrivacySettings(platform))
}

/**
 * E2E only: Chromium plays a Y4M file as the camera, so a scan can be tested without a
 * device. Must run before the app is ready.
 */
export const applyFakeCameraSwitches = (commandLine: App['commandLine'], env: NodeJS.ProcessEnv): boolean => {
  const file = env[FAKE_CAMERA_FILE_ENV]
  if (env.IS_E2E !== 'true' || !file) return false
  commandLine.appendSwitch('use-fake-device-for-media-stream')
  commandLine.appendSwitch('use-fake-ui-for-media-stream')
  commandLine.appendSwitch('use-file-for-fake-video-capture', file)
  logger.warn(`Using ${file} as the fake camera (${FAKE_CAMERA_FILE_ENV})`)
  return true
}
