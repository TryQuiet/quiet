import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('CaptchaBridge', {
  solved: (token: string) => ipcRenderer.send('hcaptcha:solved', token),
  error: (message: string) => ipcRenderer.send('hcaptcha:error', message),
})
