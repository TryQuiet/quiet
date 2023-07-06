const ci = Boolean(process.argv.filter(x => x.startsWith('--ci'))[0])
const environment = ci ? 'ci' : 'local'

const os = device.getPlatform()
const ios = os === 'ios'

const usesStorybook = Boolean(process.argv.filter(x => x.startsWith('storybook'))[0])
const test = usesStorybook ? 'storybook' : 'starter'

const baseUpdate = Boolean(process.argv.filter(x => x.startsWith('-base-update'))[0])

export default {
  environment: environment,
  os: os,
  ios: ios, // For better readable conditioning
  test: test,
  baseUpdate: baseUpdate
}
