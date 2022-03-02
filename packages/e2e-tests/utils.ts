import { ClientFunction } from 'testcafe'
import * as fs from 'fs'
import * as path from 'path'

export const getPageHTML = ClientFunction(() => {
  // Debugging purposes
  return document.documentElement.outerHTML
})

export const getDownloadedAppName = () => {
  const envs = {
    linux: '.appimage',
    win32: '.exe'
  }
  const files = fs.readdirSync('.')
  const apps = files.filter((file) => {
    return path.extname(file).toLowerCase() === envs[process.platform]
  })
  if (!apps) throw Error('NO APPS FOUND')
  return apps[0]
}