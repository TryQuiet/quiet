import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { BrowserWindow } from 'electron'

export const argvInvitationCode = (argvs: string[]): string => {
  console.log('argvInvitationCode', argvs)
  let invitationCode = ''
  for (const arg of argvs) {
    console.log('arg', arg)
    if (arg.includes('quiet://')) {
      console.log('argvInvitationCode found quiet', arg)
      try {
        invitationCode = getInvitationCode(arg)
      } catch (e) {
        console.error('cant get invitation code', e, arg)
      }
      break
    }
  }
  return invitationCode
}


export const getInvitationCode = (url: string): string => {
  console.log('URL', url)
  const data = new URL(url)
  if (data.searchParams.has('code')) {
    console.log('code',data.searchParams.get('code') )
    return data.searchParams.get('code')
  }
}

export const processInvitationCode = (mainWindow: BrowserWindow, code: string) => {
  if (!code) return
  console.log('processInvitationCode', code)
  mainWindow.webContents.send('invitation', {
    code: code
  })
}

export const handleDesktopFile = (dataPath: string, isDev: boolean) => {
  console.log('dataPath', dataPath)
  if (process.platform === 'linux' && !isDev) {
    const execInfo = `Exec=${process.env.APPIMAGE} %U`
    // create .desktop file if does not exist
    const appDesktopFile = path.join(process.env.HOME, '.local/share/applications/quiet.desktop')
    const desktopFileExists = fs.existsSync(appDesktopFile)
    console.log('desktopFileExists', appDesktopFile, desktopFileExists)
    // if (!desktopFileExists) {
    const originalFilePath = path.join(dataPath, 'quiet.desktop')
    const originalFileContent = fs.readFileSync(originalFilePath, { encoding: 'utf-8' })
    if (!originalFileContent.includes(process.env.APPIMAGE)) {
      if (originalFileContent.includes('Exec=')) {
        // Replace old Exec with new Exec
        console.log('REPLACING')
        const lines = originalFileContent.split('\n')
        lines[lines.length] = execInfo
        console.log('NEW', lines.join('\n'))
        fs.writeFileSync(originalFilePath, lines.join('\n'))
      } else {
        console.log('ADDING')
        // Add Exec
        try {
          fs.appendFileSync(originalFilePath, execInfo)
        } catch (e) {
          console.error('appendFileSync e', e)
        }
      }
    }

    try {
      fs.unlinkSync(appDesktopFile)
      console.log('unlinked')
    } catch (e) {
      console.error('unlink', e)
    }
    
    try {
      fs.linkSync(originalFilePath, appDesktopFile)
      console.log("\nHard link created\n")
        // console.log('setAsDefaultProtocolClient', app.setAsDefaultProtocolClient('quiet'))
      console.log('xdg-settings set default-url-scheme-handler')
      execSync('xdg-settings set default-url-scheme-handler quiet quiet.desktop')
    } catch (e) {
      console.error('link', e)
    }

    // }
  }
}