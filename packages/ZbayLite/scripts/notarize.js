require('dotenv').config()
const { notarize } = require('electron-notarize')

exports.default = async function notarizing (context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') {
    return
  }

  const appName = context.packager.appInfo.productFilename
  console.log(process.env.APPLEID, process.env.APPLEIDPASS)

  try {
    const response = await notarize({
      appBundleId: 'com.yourcompany.yourAppId',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLEID,
      appleIdPassword: process.env.APPLEIDPASS
    })
    return response
  } catch (e) {
    console.log('some error', e)
  }
  console.log('notarization done')
}
