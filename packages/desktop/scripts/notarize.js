/* eslint-disable no-unreachable */
const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName } = context

  if (electronPlatformName !== 'darwin' || process.env.IS_E2E) {
    console.log('skipping notarization')
    return
  }

  console.log('notarization started')

  const response = await notarize({
    tool: 'notarytool',
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASS,
    teamId: process.env.APPLE_TEAM_ID
  })

  console.log('notarization done')

  return response
}
