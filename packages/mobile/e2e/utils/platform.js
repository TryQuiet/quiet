const platform = device.getPlatform()
const ios = platform === 'ios'

export default {
  platform: platform,
  ios: ios,
}
