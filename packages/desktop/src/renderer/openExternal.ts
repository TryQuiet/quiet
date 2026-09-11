import { ipcRenderer } from 'electron'
import { OPEN_EXTERNAL_URL } from '../shared/externalLinks'

// A renderer may have inherited AppRun's loader settings from Chromium's
// zygote before main.ts ran. Always launch host helpers from the cleaned main
// process instead of calling Electron's native shell binding in the renderer.
export const openExternal = (target: string): Promise<void> => ipcRenderer.invoke(OPEN_EXTERNAL_URL, target)
