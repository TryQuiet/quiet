const fs = require('node:fs/promises')
const path = require('node:path')
const { generateAppRunScript } = require('app-builder-lib/out/targets/appimage/appImageUtil')
const { configureAppRun } = require('./appimage-launcher.cjs')

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'linux') return

  const { executableName, appInfo } = context.packager
  const source = generateAppRunScript({
    ExecutableName: executableName,
    DesktopFileName: `${executableName}.desktop`,
    ProductFilename: appInfo.productFilename,
    ProductName: appInfo.productName,
    ResourceName: `appimagekit-${executableName}`,
  })
  // Builder copies appOutDir over its generated AppImage staging directory.
  // Customize here so the final squashfs, blockmap, and update hashes all cover
  // this launcher, without downloading another tool or repacking the artifact.
  await fs.writeFile(path.join(context.appOutDir, 'AppRun'), configureAppRun(source, executableName), { mode: 0o755 })
}
