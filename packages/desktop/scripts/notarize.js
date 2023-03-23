/* eslint-disable no-unreachable */
const { notarize } = require('electron-notarize')

exports.default = async function notarizing (context) {
  return
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') {
    console.log('skipping notarization')
    return
  }

  const appName = context.packager.appInfo.productFilename
  console.log('notarization start')
  try {
    const response = await notarize({
      appBundleId: 'com.yourcompany.yourAppId',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLEID,
      appleIdPassword: process.env.APPLEIDPASS
    })
    console.log('notarization done')
    return response
  } catch (e) {
    console.error(e)
  }
}
