import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { BrowserWindow } from 'electron'

export const argvInvitationCode = (argvs: string[]): string => {
  console.log('argvInvitationCode', argvs)
  let invitationCode = ''
  for (const arg of argvs) {
    invitationCode = retrieveInvitationCode(arg)
    if (invitationCode) {
      break
    }
  }
  return invitationCode
}

export const retrieveInvitationCode = (url: string): string => {
  // Proper url: quiet://?code=<invitation code>
  let data: URL = null
  try {
    data = new URL(url)
  } catch (e) {
    return
  }
  if (!data || data.protocol !== 'quiet:') return
  if (data.searchParams.has('code')) {
    console.log('Retrieved code:', data.searchParams.get('code'))
    return data.searchParams.get('code')
  }
}

export const processInvitationCode = (mainWindow: BrowserWindow, code: string) => {
  if (!code) return
  console.log('Processing invitation code:', code)
  mainWindow.webContents.send('invitation', {
    code
  })
}

export const updateDesktopFile = (isDev: boolean) => {
  if (isDev || process.platform !== 'linux') return

  const appDesktopFile = path.join(process.env.HOME, '.local/share/applications/quiet.desktop')
  const resource = path.join(process.resourcesPath, 'quiet.desktop')

  try {
    if (!fs.existsSync(appDesktopFile)) {
      fs.cpSync(resource, appDesktopFile)
    }
  } catch (e) {
    console.error(`Can't copy .desktop file: ${e.message}`)
  }

  try {
    updateExecPath(appDesktopFile)
  } catch (e) {
    console.error(`Can't update .desktop file: ${e.message}`)
  }

  try {
    execSync('xdg-settings set default-url-scheme-handler quiet quiet.desktop')
  } catch (e) {
    console.error('Couldn\'t set default scheme handler', e.message)
  }
}

const updateExecPath = (desktopFilePath: string) => {
  console.log('updateAppImagePath')
  const execInfo = `Exec=${process.env.APPIMAGE} %U`
  const desktopFile = fs.readFileSync(desktopFilePath, { encoding: 'utf-8' })
  if (!desktopFile.includes(process.env.APPIMAGE)) {
    // Replace old Exec with new Exec
    const lines = desktopFile.split('\n')
    const newLines = lines.filter((line) => !line.includes('Exec=') && line !== '')
    newLines.push(execInfo)
    fs.writeFileSync(desktopFilePath, newLines.join('\n'))
  }
}
