// Runs before electron-builder packs (and therefore before it can upload anything): refuses to
// build a Windows or Linux release whose update feed settings are wrong, or that is to be published
// without a signing key the app accepts. Resolves the feed configuration exactly as the packager writes it
// into app-update.yml.
const { problems } = require('./verifyUpdateConfig.cjs')
const { signingProblems, willPublish } = require('./updateSigning.cjs')

exports.default = async function beforePack(context, getAppUpdatePublishConfiguration) {
  const platform = context.electronPlatformName
  if (platform !== 'win32' && platform !== 'linux') return // macOS: Squirrel.Mac checks the bundle's code signature
  const resolve =
    getAppUpdatePublishConfiguration ??
    require('app-builder-lib/out/publish/PublishManager').getAppUpdatePublishConfiguration
  const config = await resolve(context.packager, null, context.arch, false)
  const found = [...problems(config), ...(willPublish() ? signingProblems(platform) : [])]
  if (found.length > 0) {
    throw new Error(`Refusing to package ${platform}: ${found.join('; ')}`)
  }
}
