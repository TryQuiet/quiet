import { ClientFunction, t } from 'testcafe'
import * as fs from 'fs'

export const getPageHTML = ClientFunction(() => {
  // Debugging purposes
  return document.documentElement.outerHTML
})

export const goToMainPage = async () => {
  let pageUrl: string
  try {
    // Test built app version. This is a really hacky way of accessing proper mainWindowUrl
    pageUrl = fs.readFileSync('/tmp/mainWindowUrl', { encoding: 'utf8' })
  } catch {
    // If no file found assume that tests are run with a dev project venjhbrsion
    pageUrl = '../desktop/dist/main/index.html#/'
  }
  console.info(`Navigating to ${pageUrl}`)
  await t.navigateTo(pageUrl)
}

export const getBrowserConsoleLogs = async () => {
  const { error, log } = await t.getBrowserConsoleMessages()

  console.log(error)
  console.log(log)
}
