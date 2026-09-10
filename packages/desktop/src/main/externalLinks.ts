import { ipcMain, shell } from 'electron'
import { OPEN_EXTERNAL_URL } from '../shared/externalLinks'

export const registerExternalLinkHandler = (): void => {
  ipcMain.handle(OPEN_EXTERNAL_URL, (_event, target: unknown) => {
    if (typeof target !== 'string') throw new TypeError('External URL must be a string')
    return shell.openExternal(target)
  })
}
