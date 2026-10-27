// Runs before electron-builder packs (and therefore before it can upload anything): refuses to
// build a Windows or Linux release whose update feed settings are wrong, whose signing key is not one
// the app accepts, or that must be signed (QUIET_REQUIRE_UPDATE_SIGNING=1) but has no key. Resolves the
// feed configuration exactly as the packager writes it into app-update.yml.
const { problems } = require('./verifyUpdateConfig.cjs')
const { KEY_ENV, signingProblems, signingRequired } = require('./updateSigning.cjs')

exports.default = async function beforePack(context, getAppUpdatePublishConfiguration) {
  const platform = context.electronPlatformName
  if (platform !== 'win32' && platform !== 'linux') return // macOS: Squirrel.Mac checks the bundle's code signature
  const resolve =
    getAppUpdatePublishConfiguration ??
    require('app-builder-lib/out/publish/PublishManager').getAppUpdatePublishConfiguration
  const config = await resolve(context.packager, null, context.arch, false)
  const checkKey = signingRequired() || Boolean(process.env[KEY_ENV])
  const found = [...problems(config), ...(checkKey ? signingProblems(platform) : [])]
  if (found.length > 0) {
    throw new Error(`Refusing to package ${platform}: ${found.join('; ')}`)
  }
}
