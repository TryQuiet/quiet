import { ipcRenderer } from 'electron'

export const openExternalUrl = async (url: string): Promise<boolean> => {
  return ipcRenderer.invoke('open-external-url', url)
}

export const showItemInFolder = async (filePath: string): Promise<boolean> => {
  return ipcRenderer.invoke('show-item-in-folder', filePath)
}
