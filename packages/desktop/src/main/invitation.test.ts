import { updateExecPath } from './invitation'
import tmp from 'tmp'
import path from 'path'
import fs from 'fs'

describe('Invitation code helper', () => {
  const originalEnv = process.env
  let appImagePath: string
  let filePath: string
  let desktopFileEntry: string

  beforeEach(() => {
    jest.resetModules()
    appImagePath = '/path/Quiet.AppImage'
    process.env = {
      ...originalEnv,
      APPIMAGE: appImagePath,
    }
    const tmpDir = tmp.dirSync({ mode: 0o750, prefix: 'quietDesktop', unsafeCleanup: true }).name
    filePath = path.join(tmpDir, '.desktop')
    desktopFileEntry = `[Desktop Entry]\nName=Quiet\nExec=${appImagePath} %U`
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('replaces Exec in .desktop file if APPIMAGE path differs', () => {
    fs.writeFileSync(filePath, '[Desktop Entry]\nName=Quiet\nExec=/old/path/Quiet.AppImage %U')
    updateExecPath(filePath)
    const updatedContent = fs.readFileSync(filePath, { encoding: 'utf-8' })
    expect(updatedContent).toEqual(desktopFileEntry)
  })

  it('adds Exec to .desktop file', () => {
    fs.writeFileSync(filePath, '[Desktop Entry]\nName=Quiet')
    updateExecPath(filePath)
    const updatedContent = fs.readFileSync(filePath, { encoding: 'utf-8' })
    expect(updatedContent).toEqual(desktopFileEntry)
  })

  it('does not modify .desktop file if Exec is valid', () => {
    fs.writeFileSync(filePath, desktopFileEntry)
    const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')
    updateExecPath(filePath)
    expect(writeFileSyncSpy).not.toBeCalled()
    const content = fs.readFileSync(filePath, { encoding: 'utf-8' })
    expect(content).toEqual(desktopFileEntry)
  })
})
