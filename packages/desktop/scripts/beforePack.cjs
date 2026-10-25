// Runs before electron-builder packs (and therefore before it can upload anything): refuses to
// build a Windows or Linux release whose app-update.yml would not carry the update-verification
// settings. Resolves the configuration exactly as the packager writes it into app-update.yml.
const { problems } = require('./verifyUpdateConfig.cjs')

const platforms = { win32: 'win', linux: 'other' }

exports.default = async function beforePack(context, getAppUpdatePublishConfiguration) {
  const platform = platforms[context.electronPlatformName]
  if (platform == null) return // macOS: Squirrel.Mac checks the bundle's code signature itself
  const resolve =
    getAppUpdatePublishConfiguration ??
    require('app-builder-lib/out/publish/PublishManager').getAppUpdatePublishConfiguration
  const config = await resolve(context.packager, null, context.arch, false)
  const found = problems(config, platform)
  if (found.length > 0) {
    throw new Error(`Refusing to package ${context.electronPlatformName}: ${found.join('; ')}`)
  }
}
