/* eslint-disable no-unreachable */
const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  const appName = context.packager.appInfo.productFilename
  const skip =
    electronPlatformName !== 'darwin' ||
    process.env.GITHUB_EVENT_NAME === 'pull_request' ||
    process.env.IS_LOCAL === 'true' ||
    process.env.IS_E2E === 'true'

  if (skip) {
    console.log('[notarize] Skipping notarization (preview build or no cert)')
    return
  }

  console.log('notarization started')

  const response = await notarize({
    tool: 'notarytool',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASS,
    teamId: process.env.APPLE_TEAM_ID,
  })

  console.log('notarization done')

  return response
}
